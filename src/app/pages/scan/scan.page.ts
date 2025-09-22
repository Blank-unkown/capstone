import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { NgZone } from '@angular/core';
import { BubbleTemplate, bubbles, Option, BubbleCoordinate } from '../../data/bubble-template';
import { Platform } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { NavController } from '@ionic/angular';
import { Chart } from 'chart.js';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { FormsModule } from '@angular/forms';
import { CameraService } from '../../services/camera.service';
import { PreloaderService } from '../../services/preloader.service';
import jsQR from 'jsqr';
import { ScanService } from '../../services/scan.service';
import { ScanAnswerService } from '../../services/scanAnswer.service';
import { Optional } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { AnswerKeyService } from '../../services/answer-key.service';

declare var cv: any;
declare const Tesseract: any;

export interface ScannedResult {
  id: number;
  headerImage: string;
  fullImage: string;
  answers: AnswerEntry[];
  score: number;
  total: number;
  subjectId: number;
  classId: number;
  timestamp: string;
  answerDistribution: Record<'A'|'B'|'C'|'D', number>;
  cognitiveBreakdown: { [level: string]: { correct: number; total: number } };
  tosRows: TopicEntry[];
}
export interface TopicEntry {
  topicName: string;
  learningCompetency: string;
  days: number;
  percent: number;
  expectedItems?: number;
  remembering?: number;
  understanding?: number;
  applying?: number;
  analyzing?: number;
  evaluating?: number;
  creating?: number;
}
interface Question {
  questionNumber: number;
  answer: 'A' | 'B' | 'C' | 'D';
}
interface AnswerSheet {
  id: number;
  teacher_id: number;
  subject: string;
  questions: Question[];
}
export interface Result {
  question: number;
  marked: Option | null;
  correctAnswer: Option | null;
  correct: boolean;
  topic?: string | null;       // ✅ added
  competency?: string | null;  // ✅ added
  level?: string | null;       // ✅ added
}

export interface AnswerEntry {
  question: number;
  marked: Option | null;
  correctAnswer: Option | null;
  correct: boolean;
  topic?: string | null;
  competency?: string | null;
  level?: string | null;
}

function isOption(value: string | null): value is Option {
  return value === 'A' || value === 'B' || value === 'C' || value === 'D';
}
function isGoodWarpCandidate(corners: { x: number, y: number }[]): boolean {
  const dx = (p1: { x: number, y: number }, p2: { x: number, y: number }) => p2.x - p1.x;
  const dy = (p1: { x: number, y: number }, p2: { x: number, y: number }) => p2.y - p1.y;
  const dist = (p1: { x: number, y: number }, p2: { x: number, y: number }) =>
    Math.hypot(dx(p1, p2), dy(p1, p2));

  const angle = (
    a: { x: number, y: number },
    b: { x: number, y: number },
    c: { x: number, y: number }
  ) => {
    const ab: [number, number] = [dx(a, b), dy(a, b)];
    const cb: [number, number] = [dx(c, b), dy(c, b)];
    const dot = ab[0] * cb[0] + ab[1] * cb[1];
    const mag1 = Math.hypot(...ab);
    const mag2 = Math.hypot(...cb);
    return Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
  };

  const [tl, tr, br, bl] = corners;

  const widthTop = dist(tl, tr);
  const widthBottom = dist(bl, br);
  const heightLeft = dist(tl, bl);
  const heightRight = dist(tr, br);

  const avgWidth = (widthTop + widthBottom) / 2;
  const avgHeight = (heightLeft + heightRight) / 2;
  const ratio = avgHeight / avgWidth;

  // 1. Aspect ratio check (A4 paper is about 1.414)
  if (ratio < 1.3 || ratio > 1.5) return false;

  // 2. Opposite side length similarity check
  if (Math.abs(widthTop - widthBottom) > 40 || Math.abs(heightLeft - heightRight) > 40) return false;

  // 3. Internal angle check
  const angles = [
    angle(tl, tr, br),
    angle(tr, br, bl),
    angle(br, bl, tl),
    angle(bl, tl, tr),
  ];
  if (angles.some(a => a < 80 || a > 100)) return false;

  return true;
}
@Component({
  selector: 'app-scan',
  templateUrl: 'scan.page.html',
  styleUrls: ['scan.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule],
  providers: [AndroidPermissions],
})
export class ScanPage implements AfterViewInit {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('video', { static: false }) videoRef!: ElementRef<HTMLVideoElement>;

  canvasWidth = 800;
  canvasHeight = Math.round(800 * 1.414);
  latestWarpedMat: any = null;
  latestWarpedMatBase64: string | null = null; // ✅ add this

  // Inside ScanPage class
  latestResult: ScannedResult | null = null;
  latestResultId: number | null = null; // or string, depending on how you save IDs
  //latestWarpedMat: any = null;
  classId: number = 0;
  subjectId: number = 0;
  chart: Chart | undefined;
  chartInstance: any = null;
  scannedImageUrl: string | null = null;
  studentPercentage: number = 0;
  classAveragePercentage: number = 0;
  showCamera = false;
  showCroppedImage = false;
  croppedHeaderBase64: string = '';
  fullImageBase64: string = '';
  croppedImageUrl: string | null = null;
  cropOpacity = 1;
  score: number = 0;
  results: Result[] = [];
  detectionBoxes = [
    { x: 0, y: 0, width: 125, height: 125 },
    { x: 0, y: 500, width: 125, height: 125 },
    { x: 355, y: 0, width: 125, height: 125 },
    { x: 355, y: 500, width: 125, height: 125 }
  ];

  detectedContours: any;
  isSheetScanned: boolean = false;
  answers: any[] = [];
  total: number = 0;
  detectedAnswers: { [questionNumber: string]: string | null } = {};
  hasResults: boolean = false;
  subject!: string;
  cvInitialized = false;
  tosRows: any[] = [];
  answerSheets: AnswerSheet[] = [];
  answerKey: { [questionNumber: number]: string } = {};

  // internal OpenCV helpers (optional; only create if needed by your processVideo)
  private srcMat: any = null;
  private cap: any = null;

  constructor(
    private ngZone: NgZone,
    private platform: Platform,
    private router: Router,
    private http: HttpClient,
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private cameraService: CameraService,
    private preloader: PreloaderService,         // ✅ new
    private scanAnswerService: ScanAnswerService, // ✅ new
    private alertCtrl: AlertController,
      private answerKeyService: AnswerKeyService,
  private scanService: ScanService,
    @Optional() private androidPermissions?: AndroidPermissions,
  ) {}
 
  async ngAfterViewInit() {
      await this.waitForVideoElement();
      // Load OpenCV
      await this.waitForOpenCV();
      // Load answer key from params
      this.route.queryParams.subscribe(params => {
        this.classId = Number(params['classId']);
        this.subjectId = Number(params['subjectId']);
        this.scanService.getScans(this.classId, this.subjectId).subscribe({
          next: (scans) => {
            // You could preload scans if needed
            console.log("✅ Loaded scans:", scans);
          },
          error: (err) => {
            console.error("❌ Failed to load scans", err);
          }
        })
        this.http.get<any[]>(`https://capstone-wwbm.onrender.com/subjects/${this.classId}/${this.subjectId}/tos`).subscribe({
          next: (tos: any[]) => {
            this.tosRows = tos;
          },
          error: (err) => {
            console.error("❌ Failed to load TOS", err);
            this.tosRows = [];
          }
        });
        
    // ✅ Load Answer Key (typed map)
    // ✅ Fetch Answer Key
        this.answerKeyService.getAnswerKeyMap(this.classId, this.subjectId).subscribe({
          next: (keyMap) => {
            this.answerKey = keyMap;
            this.total = Object.keys(keyMap).length;
            console.log("✅ Answer Key Map (scan):", this.answerKey);
            console.log("➡️ typeof keyMap:", typeof keyMap);
            console.log("➡️ Keys:", Object.keys(keyMap));
          },
          error: (err) => {
            console.error("❌ Failed to load answer key", err);
          }
        });
      });
      // ✅ Start camera only once here
      this.onStartCameraButtonClick();
    }

 private async waitForOpenCV(): Promise<void> {
  while (!(window as any).cv || !(window as any).cv.Mat) {
    await new Promise(res => setTimeout(res, 50));
  }
  console.log("✅ OpenCV is ready");
}

  private async waitForVideoElement(): Promise<void> {
    while (!this.videoRef || !this.videoRef.nativeElement) {
      await new Promise(res => setTimeout(res, 10));
    }
  }
private initOpenCVMatsAndCapture(videoEl: HTMLVideoElement) {
  if (typeof (window as any).cv !== 'undefined') {
    // Proceed with initialization
  } else {
    console.warn('OpenCV is not available. Please try again later.');
    alert('OpenCV is not available. Please try again later.');
  }
}

onStartCameraButtonClick() {
  this.showCamera = true;

  // Wait for Angular to render the <video> element
  setTimeout(() => {
    this.startCameraView();
  }, 0);
}

  startCameraView() {
  const videoEl: HTMLVideoElement = this.videoRef?.nativeElement;
  if (!videoEl) {
    console.warn('Video element not ready, retrying...');
    setTimeout(() => this.startCameraView(), 50); // retry shortly
    return;
  }

  navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'environment',
      width: { ideal: 640 },
      height: { ideal: 480 }
    }
  }).then((stream) => {
    videoEl.srcObject = stream;
    videoEl.play();
    videoEl.onloadedmetadata = () => {
      videoEl.width = 640;
      videoEl.height = 480;
      this.processVideo();
    };
  }).catch((err) => {
    console.error('Camera error:', err);
    alert('Error accessing camera: ' + err.message);
  });
  }
    
  goToResultViewer(result?: ScannedResult | null) {
  const payload = result ?? this.latestResult;
  if (!payload) return;
  this.router.navigate(['/resultviewer'], {
    state: { resultData: payload }
  });
}
  reset() {
    this.showCamera = false;
    this.showCroppedImage = false;
    this.croppedImageUrl = null;
    this.showDetectionBoxes = true; // re-enable boxes for next scan
    if (this.videoRef?.nativeElement?.srcObject) {
      const stream = this.videoRef.nativeElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.videoRef.nativeElement.srcObject = null;
    }
  }


  // New flag at the top of your scan.page.ts
  showDetectionBoxes: boolean = true;

  drawDetectionBoxes(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!this.showDetectionBoxes) return; // skip drawing entirely
    ctx.save();
    ctx.globalAlpha = 1.0;
    this.detectionBoxes.forEach(box => {
      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    });
    ctx.restore();
  }

  isRectInsideDetectionBoxes(rect: { x: number; y: number; width: number; height: number }) {
    return this.detectionBoxes.some(box => {
      return (
        rect.x >= box.x &&
        rect.y >= box.y &&
        rect.x + rect.width <= box.x + box.width &&
        rect.y + rect.height <= box.y + box.height
      );
    });
  }

    processVideo() {
    try {
        const video = this.videoRef.nativeElement;
        const canvas = this.canvasRef.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            alert('Could not get canvas context');
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const src = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
        const gray = new cv.Mat();
        const blurred = new cv.Mat();
        const edges = new cv.Mat();
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();

    const FPS = 10;
    let stopped = false;

    const process = () => {
      if (stopped) return;
      if (!video || video.readyState < 2) {
        requestAnimationFrame(process);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      this.drawDetectionBoxes(ctx, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      src.data.set(imageData.data);

      cv.cvtColor(src, gray, cv.COLOR_BGR2GRAY);
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
      cv.threshold(blurred, edges, 60, 255, cv.THRESH_BINARY_INV);
      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let detectedBoxes = new Array(this.detectionBoxes.length).fill(false);

      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);
        const approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * cv.arcLength(cnt, true), true);

        if (
          approx.rows === 4 &&
          cv.isContourConvex(approx) &&
          cv.contourArea(approx) > 300 &&  // min size
          cv.contourArea(approx) < 3000    // max size
        ) {
          const rect = cv.boundingRect(approx);

          this.detectionBoxes.forEach((box, idx) => {
            if (
              rect.x >= box.x &&
              rect.y >= box.y &&
              rect.x + rect.width <= box.x + box.width &&
              rect.y + rect.height <= box.y + box.height
            ) {
              detectedBoxes[idx] = true;
              ctx.save();
              ctx.strokeStyle = 'red';
              ctx.lineWidth = 4;
              ctx.globalAlpha = 0.7;
              ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
              ctx.fillStyle = 'rgba(255,0,0,0.2)';
              ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
              ctx.restore();
            }
          });
        }
        approx.delete();
        cnt.delete();
      }

      // In the processVideo function, when all boxes are detected:
      if (detectedBoxes.every(v => v) && !this.croppedImageUrl) {
          stopped = true;
          // REMOVE or COMMENT OUT these lines:
          // this.showCamera = false;  // Hide the camera view
          // if (this.videoRef.nativeElement.srcObject) {
          //     const stream = this.videoRef.nativeElement.srcObject as MediaStream;
          //     stream.getTracks().forEach(track => track.stop());
          // }
          this.detectAndCropPaper();
          return;
      }

      requestAnimationFrame(process);
    };

    requestAnimationFrame(process);
    } catch (error) {
        console.error('Error in processVideo:', error);
    }
    }

    // helper
  async presentAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async detectAndCropPaper(): Promise<ScannedResult | null> {
  const log = (...args: any[]) => console.log("[detectAndCropPaper]", ...args);

  try {
    this.presentAlert("Scan Step", "Init started");
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) throw new Error("Canvas element not found");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context missing");

    // Read canvas into OpenCV Mat
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
    alert("✅ Canvas read + grayscale + blur applied");

    const markerCorners: { x: number; y: number }[] = [];
    if (!Array.isArray(this.detectionBoxes) || this.detectionBoxes.length === 0) {
      throw new Error("No detectionBoxes found");
    }
    alert(`📦 detectionBoxes count: ${this.detectionBoxes.length}`);

    // 🔹 Detect 4 corners
    for (const [i, box] of this.detectionBoxes.entries()) {
      alert(`🔍 Processing detectionBox ${i + 1}`);
      const roi = gray.roi(new cv.Rect(box.x, box.y, box.width, box.height));
      const roiContours = new cv.MatVector();
      const roiHierarchy = new cv.Mat();
      cv.threshold(roi, roi, 90, 255, cv.THRESH_BINARY_INV);
      cv.findContours(roi, roiContours, roiHierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let bestQuad: Array<{ x: number; y: number }> | null = null;
      let maxArea = 0;

      for (let i = 0; i < roiContours.size(); i++) {
        const cnt = roiContours.get(i);
        const approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * cv.arcLength(cnt, true), true);

        if (approx.rows === 4 && cv.isContourConvex(approx)) {
          const area = cv.contourArea(approx);
          if (area > 300 && area < 3000 && area > maxArea) {
            maxArea = area;
            bestQuad = [];
            for (let j = 0; j < 4; j++) {
              const pt = approx.data32S.slice(j * 2, j * 2 + 2);
              bestQuad.push({ x: pt[0] + box.x, y: pt[1] + box.y });
            }
          }
        }
        approx.delete();
        cnt.delete();
      }

      if (bestQuad) {
        alert(`✅ Quad found in box ${i + 1}, area=${maxArea}`);
        markerCorners.push(bestQuad[0]); // just pick one
      } else {
        alert(`⚠️ No quad in box ${i + 1}, using fallback center`);
        markerCorners.push({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
      }

      roi.delete();
      roiContours.delete();
      roiHierarchy.delete();
    }
    gray.delete();

    if (markerCorners.length !== 4) throw new Error("Expected 4 corners, got " + markerCorners.length);
    alert("✅ Found 4 corners, ordering...");

    // 🔹 Order corners (TL, TR, BR, BL)
    markerCorners.sort((a, b) => a.y - b.y);
    const top = markerCorners.slice(0, 2).sort((a, b) => a.x - b.x);
    const bottom = markerCorners.slice(2, 4).sort((a, b) => a.x - b.x);
    const ordered = [top[0], top[1], bottom[1], bottom[0]];

    const FIXED_WIDTH = 800;
    const FIXED_HEIGHT = Math.round(800 * 1.414);
    alert(`📐 Perspective target size: ${FIXED_WIDTH}x${FIXED_HEIGHT}`);

    const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      ordered[0].x, ordered[0].y,
      ordered[1].x, ordered[1].y,
      ordered[2].x, ordered[2].y,
      ordered[3].x, ordered[3].y
    ]);
    const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0,
      FIXED_WIDTH, 0,
      FIXED_WIDTH, FIXED_HEIGHT,
      0, FIXED_HEIGHT
    ]);
    const M = cv.getPerspectiveTransform(srcPoints, dstPoints);
    const dst = new cv.Mat();
    cv.warpPerspective(src, dst, M, new cv.Size(FIXED_WIDTH, FIXED_HEIGHT));
    alert("✅ Perspective transform complete");

    // ✅ Save warpedMat for processSheet
    if (this.latestWarpedMat) this.latestWarpedMat.delete();
    this.latestWarpedMat = dst.clone();

    // Show warped result
    canvas.width = FIXED_WIDTH;
    canvas.height = FIXED_HEIGHT;
    cv.imshow(canvas, dst);

    // Disable detection boxes
    this.showDetectionBoxes = false;
    this.detectionBoxes = [];
    alert("📸 Warped sheet drawn on canvas");

    // 🔹 Crop header
    const HEADER_HEIGHT = 250;
    const headerMat = dst.roi(new cv.Rect(0, 0, dst.cols, HEADER_HEIGHT));
    const headerCanvas = document.createElement("canvas");
    headerCanvas.width = headerMat.cols;
    headerCanvas.height = headerMat.rows;
    cv.imshow(headerCanvas, headerMat);
    this.croppedHeaderBase64 = headerCanvas.toDataURL("image/jpeg", 0.8); // compressed JPEG
    headerMat.delete();
    alert("📎 Header cropped + saved");

    // ✅ Log header + warped sizes
    const sizeKB = (b64: string) =>
      b64 ? Math.round((b64.length * (3 / 4)) / 1024) : 0;

    const warpedSize = sizeKB(canvas.toDataURL("image/jpeg", 0.8));
    const headerSize = sizeKB(this.croppedHeaderBase64);
    alert(`📏 Size check: header=${headerSize}KB, warped=${warpedSize}KB`);
    alert("📥 Answer key passed in: " + JSON.stringify(this.answerKey));

    // 🔹 Process bubbles + overlay + build result
    const overlayCtx = canvas.getContext("2d");
    let result: ScannedResult | null = null;
    if (overlayCtx) {
      alert("🔄 Passing to processSheet with answerKey...");
      result = await this.processSheet(overlayCtx, this.answerKey);
    } else {
      alert("⚠️ overlayCtx missing, skipping processSheet");
    }

    // Cleanup mats
    src.delete();
    dst.delete();
    srcPoints.delete();
    dstPoints.delete();
    M.delete();

    this.presentAlert("Scan Step", "Done detectAndCropPaper, proceeding to processSheet.");
    return result;

  } catch (err: any) {
    this.presentAlert("Error", "detectAndCropPaper failed: " + err.message);
    alert("❌ detectAndCropPaper failed: " + err.message);
    return null;
  }
}

// 🔹 Convert Base64 → Blob
dataURItoBlob(dataURI: string) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}
// 🔹 Main handler after scanning (now receives the result from processSheet)
// 🔹 Main handler after scanning (receives the result from processSheet)
async handleScanComplete(result: ScannedResult) {
  if (!result) {
    console.warn("⚠️ handleScanComplete received null result, skipping.");
    alert("⚠️ handleScanComplete received null result, skipping.");
    return;
  }

  try {
    alert("💾 handleScanComplete: Saving scan to backend...");

    // 1. Save scan + answers
    await this.saveScanToBackend(result);

    alert("✅ handleScanComplete: Navigating to result viewer...");

    // 2. Navigate to result viewer
    this.goToResultViewer(result);

  } catch (err: any) {
    console.error("❌ Failed to save scan", err);
    alert("❌ Failed to save scan to backend: " + err.message);
  }
}

// 🔹 Save scanned result to backend (scan + answers)
async saveScanToBackend(result: ScannedResult): Promise<void> {
  alert("💾 saveScanToBackend: Preparing safeResults...");

  // ✅ Convert answers safely from result.answers
  const safeResults = (result.answers || []).map(r => ({
    question_number: r.question,
    marked: r.marked ? String(r.marked) : null,     // ✅ match DB column
    correct_answer: r.correctAnswer ? String(r.correctAnswer) : null,
    correct: r.correct,                             // ✅ boolean/0/1 based on backend
    topic: r.topic || null,
    competency: r.competency || null,
    level: r.level || null
  }));

  // ✅ Match backend schema
  const scanData = {
    subject_id: result.subjectId,
    class_id: result.classId,
    score: result.score,
    total: result.total,
    header_image: result.headerImage,
    full_image: result.fullImage,
    timestamp: result.timestamp,
    answers: safeResults
  };

  alert("📡 saveScanToBackend: Sending scanData to backend...");

  return new Promise<void>((resolve, reject) => {
    this.scanService.createScan(result.classId, result.subjectId, scanData).subscribe({
      next: (res: any) => {
        const scanId = res.scanId;
        alert("✅ saveScanToBackend: Scan saved with scanId=" + scanId);

        // ✅ Save answers separately linked to scanId
        this.scanAnswerService.saveAnswers(scanId, safeResults).subscribe({
          next: () => {
            console.log("✅ Scan + answers saved!");
            alert("✅ saveScanToBackend: Answers saved successfully!");
            resolve();
          },
          error: (err: any) => {
            console.error("❌ Error saving answers:", err);
            alert("❌ saveScanToBackend: Error saving answers - " + err.message);
            reject(err);
          }
        });
      },
      error: (err: any) => {
        console.error("❌ Error saving scan:", err);
        alert("❌ saveScanToBackend: Error saving scan - " + err.message);
        reject(err);
      }
    });
  });
}

// 🔹 Detect bubbles, overlay, and build result object
async processSheet(
  ctx?: CanvasRenderingContext2D,
  answerKey?: Record<number, any>
): Promise<ScannedResult | null> {
  if (!this.latestWarpedMat || this.latestWarpedMat.empty()) {
    alert("⚠️ processSheet: No warpedMat available.");
    return null;
  }
  if (!this.answerKey || Object.keys(this.answerKey).length === 0) {
  console.warn("⚠️ No answer key loaded yet, skipping scoring overlays");
  return null;
}

  // ✅ Normalize answerKey (looser, old-style)
  const rawKey: Record<number, any> = answerKey || this.answerKey || {};

  // Helper to coerce into Option | null
  const getCorrectAnswer = (qNum: number): Option | null => {
    const val = rawKey[qNum];
    return val && ["A", "B", "C", "D"].includes(val) ? val as Option : null;
  };
  const toGray = (src: any) => {
    const gray = new cv.Mat();
    const code =
      typeof src.channels === "function" && src.channels() === 4
        ? cv.COLOR_RGBA2GRAY
        : cv.COLOR_BGR2GRAY;
    cv.cvtColor(src, gray, code);
    return gray;
  };

  const H = this.latestWarpedMat.rows;
  const W = this.latestWarpedMat.cols;
  const kernel = cv.Mat.ones(3, 3, cv.CV_8U);

  this.detectedAnswers = {};
  this.results = [];
  this.score = 0;

  // 🔹 Use preloaded TOS
  const tosRows = this.tosRows || [];
  const tosTotal = tosRows.reduce((sum, row) => sum + (row.expectedItems || 0), 0);
  const maxItems = tosTotal > 0 ? tosTotal : bubbles.length;
  this.total = maxItems;

  // ✅ Draw warped sheet
  const canvas = this.canvasRef.nativeElement;
  cv.imshow(canvas, this.latestWarpedMat);
  const overlayCtx = canvas.getContext("2d");
  if (!overlayCtx) return null;

  const ring = (x: number, y: number, r: number, color: string, lw = 2) => {
    overlayCtx.beginPath();
    overlayCtx.arc(x, y, r, 0, 2 * Math.PI);
    overlayCtx.lineWidth = lw;
    overlayCtx.strokeStyle = color;
    overlayCtx.stroke();
  };

  let processed = 0;

  for (const bubble of bubbles) {
    if (processed >= maxItems) break;
    const qNum = bubble.question as number;

    const ratios: Record<Option, number> = { A: 0, B: 0, C: 0, D: 0 };

    for (const opt of ["A", "B", "C", "D"] as const) {
      const { cx, cy, radius } = bubble.options[opt];
      const side = Math.max(2 * radius, 1);
      const x = Math.max(0, Math.min(W - 1, Math.round(cx - radius)));
      const y = Math.max(0, Math.min(H - 1, Math.round(cy - radius)));
      const w = Math.min(side, W - x);
      const h = Math.min(side, H - y);

      const patch = this.latestWarpedMat.roi(new cv.Rect(x, y, w, h));
      const gray = toGray(patch);

      const bin = new cv.Mat();
      cv.threshold(gray, bin, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);
      if (cv.countNonZero(bin) < 10) {
        cv.threshold(gray, bin, 130, 255, cv.THRESH_BINARY_INV);
      }

      const mask = cv.Mat.zeros(h, w, cv.CV_8UC1);
      const rx = Math.min(w, h) / 2 - 1;
      cv.circle(
        mask,
        new cv.Point(Math.round(w / 2), Math.round(h / 2)),
        Math.round(rx),
        new cv.Scalar(255),
        -1
      );

      const masked = new cv.Mat();
      cv.bitwise_and(bin, mask, masked);
      cv.morphologyEx(masked, masked, cv.MORPH_OPEN, kernel);

      const nonZero = cv.countNonZero(masked);
      const totalPixels = Math.PI * rx * rx;
      ratios[opt] = nonZero / totalPixels;

      patch.delete(); gray.delete(); bin.delete(); mask.delete(); masked.delete();
    }

    // 🔹 Detect marked answer
    let selected: Option | null = null;
    let bestRatio = 0.50;
    for (const opt of ["A", "B", "C", "D"] as const) {
      if (ratios[opt] > bestRatio) {
        bestRatio = ratios[opt];
        selected = opt;
      }
    }

    // 🔹 Correct answer (loose old-style but typed)
    const correctAnswer = getCorrectAnswer(qNum);
    const isCorrect = !!(selected && correctAnswer && selected === correctAnswer);
    if (isCorrect) this.score++;

    this.detectedAnswers[String(qNum)] = selected ?? null;
    this.results.push({
      question: qNum,
      marked: selected,
      correctAnswer,
      correct: isCorrect,
      topic: bubble.topic ?? null,
      competency: bubble.competency ?? null,
      level: bubble.level ?? null,
    });
    processed++;

    // 🔹 Overlay
    for (const opt of ["A", "B", "C", "D"] as const) {
      const { cx, cy, radius } = bubble.options[opt];
      let color = "blue";
      if (opt === selected && opt === correctAnswer) color = "green";
      else if (opt === selected && opt !== correctAnswer) color = "red";
      else if (opt === correctAnswer) color = "yellow";

      ring(cx, cy, radius, color, 2);
    }
  }

  // Finalize score
  this.studentPercentage = this.total > 0 ? (this.score / this.total) * 100 : 0;
  this.hasResults = true;

  // ✅ Convert canvas to DataURL
  let warpedDataUrl = "";
  try {
    warpedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
  } catch (e) {
    console.error("⚠️ Failed to export warpedDataUrl:", e);
  }

  const headerBase64 = this.croppedHeaderBase64 ?? "";

  const answerDistribution = this.results.reduce(
    (acc, a) => {
      if (a.marked) acc[a.marked] = (acc[a.marked] || 0) + 1;
      return acc;
    },
    { A: 0, B: 0, C: 0, D: 0 }
  );

  const cognitiveBreakdown = this.results.reduce((acc, a) => {
    const lvl = a.level || "N/A";
    if (!acc[lvl]) acc[lvl] = { correct: 0, total: 0 };
    acc[lvl].total++;
    if (a.correct) acc[lvl].correct++;
    return acc;
  }, {} as Record<string, { correct: number; total: number }>);

  const result: ScannedResult = {
    id: Date.now(),
    headerImage: headerBase64,
    fullImage: warpedDataUrl,
    answers: this.results,   // ✅ already fixed if step 1 done
    score: this.score,
    total: this.total,
    subjectId: this.subjectId,
    classId: this.classId,
    timestamp: new Date().toISOString(),
    answerDistribution,
    cognitiveBreakdown,
    tosRows,
  };

  kernel.delete();
  await this.handleScanComplete(result);
  return result;
}

renderAnswerDistributionChart() {
  if (this.chart) {
    this.chart.destroy();
  }
  const questions = Object.keys(this.detectedAnswers).sort((a, b) => +a - +b);
  const answerOptions = ['A', 'B', 'C', 'D'];
  const colors = ['#f44336', '#2196f3', '#4caf50', '#ffeb3b'];

  const answerCounts = questions.map(q => {
    const answer = this.detectedAnswers[q];
    return answerOptions.map(opt => (answer === opt ? 1 : 0));
  });

  const datasets = answerOptions.map((option, idx) => ({
    label: `Option ${option}`,
    data: answerCounts.map(counts => counts[idx]),
    backgroundColor: colors[idx],
  }));

  const ctx = document.getElementById('answersChart') as HTMLCanvasElement;
  if (!ctx) return;

  this.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: questions.map(q => `Q${q}`),
      datasets: datasets,
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Answer Distribution (Scanned Sheet)',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
          title: { display: true, text: 'Selections' },
        },
        x: {
          title: { display: true, text: 'Questions' },
        },
      },
    },
  });
}

processResultsAndShowChart() {
  this.renderAnswerDistributionChart();
  }
}