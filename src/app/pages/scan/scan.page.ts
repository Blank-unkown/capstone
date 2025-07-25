import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { NgZone } from '@angular/core';
import { BubbleTemplate, bubbles, Option, BubbleCoordinate } from '../../data/bubble-template';
import { Platform } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { NavController } from '@ionic/angular';
import { Chart } from 'chart.js';
import { LocalDataService, ScannedResult } from '../../services/local-data.service';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { FormsModule } from '@angular/forms';

declare var cv: any;
  

interface Question {
  questionNumber: number;
  answer: 'A' | 'B' | 'C' | 'D'; // or just string if you want more flexibility
}
interface AnswerSheet {
  id: number;
  teacher_id: number;
  exam_title: string;
  subject: string;
  grade_level: string;
  questions: Question[];
}
interface Result {
  question: number;
  marked: Option | null;        // user marked answer
  correctAnswer: Option | null; // correct answer from key
  correct: boolean;             // is user answer correct?
}

function isOption(value: string | null): value is Option {
  return value === 'A' || value === 'B' || value === 'C' || value === 'D';
}

@Component({
  selector: 'app-scan',
  templateUrl: 'scan.page.html',
  styleUrls: ['scan.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule],
})
export class ScanPage implements AfterViewInit {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('video', { static: false }) videoRef!: ElementRef<HTMLVideoElement>;

  canvasWidth = 800;
  canvasHeight = Math.round(800 * 1.414);
  
latestWarpedMat: any = null;
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
    { x: 0, y: 475, width: 125, height: 125 },
    { x: 330, y: 0, width: 125, height: 125 },
    { x: 330, y: 475, width: 125, height: 125 }
  ];

  detectedContours: any;
  isSheetScanned: boolean = false;
  answers: any[] = [];
  total: number = 0;
  detectedAnswers: { [questionNumber: string]: string | null } = {};
  hasResults: boolean = false;
  examTitle!: string;
  subject!: string;
  gradeLevel!: string;

  constructor(
    private ngZone: NgZone,
    private platform: Platform,
    private router: Router,
    private http: HttpClient,
    private navCtrl: NavController,
    private route: ActivatedRoute,
     private androidPermissions: AndroidPermissions
  ) {}

  async ngAfterViewInit() {
    
    if (typeof cv === 'undefined') {
      alert('OpenCV.js is not loaded!');
      return;
    }
    this.androidPermissions.requestPermissions([
      this.androidPermissions.PERMISSION.CAMERA
    ]).then(result => {
      if (result.hasPermission) {
        this.startCameraView();
      } else {
        alert('Camera permission denied');
      }
    }).catch(err => {
      alert('Permission error: ' + err);
    });

    this.route.queryParams.subscribe(params => {
    this.classId = Number(params['classId']);
    this.subjectId = Number(params['subjectId']);

    const subject = LocalDataService.getSubject(this.classId, this.subjectId);
    if (!subject || !subject.answerKey) {
      alert('❌ No answer key found for this subject!');
      return;
    }

    this.answerKey = {};
    subject.answerKey.forEach((ans: string, idx: number) => {
      this.answerKey[idx + 1] = ans;
    });
    this.total = subject.answerKey.length;

    this.examTitle = params['examTitle'] || '';
    this.subject = params['subject'] || '';
    this.gradeLevel = params['gradeLevel'] || '';

  });

  }
  answerSheets: AnswerSheet[] = [];
  answerKey: { [questionNumber: number]: string } = {}; // Ensure this exists


  goToResultViewer() {
    this.router.navigate(['/resultviewer'], {
  state: {
    resultData: {
      score: this.score,
      total: this.total,
      percentage: (this.total > 0 ? (this.score / this.total) * 100 : 0),
      answers: this.results.map(r => ({
        number: r.question,
        selected: r.marked,
        correctAnswer: r.correctAnswer,
        correct: r.correct,
        blank: r.marked === null
      }))
    }
  }
});

  }
  onStartCameraButtonClick() {
    this.showCamera = true;
    setTimeout(() => this.startCameraView(), 0);
  }

  startCameraView() {
    if (!this.videoRef?.nativeElement) {
      alert('Video element not ready');
      return;
    }

    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    }).then((stream) => {
      const video = this.videoRef.nativeElement;
      video.srcObject = stream;
      video.play();
      video.onloadedmetadata = () => {
        video.width = 640;
        video.height = 480;
        this.processVideo();
      };
    }).catch((err) => {
      console.error('Camera error:', err);
      alert('Error accessing camera: ' + err.message);
    });
  }

  
  drawDetectionBoxes(ctx: CanvasRenderingContext2D, width: number, height: number) {
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

      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
      cv.Canny(blurred, edges, 75, 150);
      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let detectedBoxes = new Array(this.detectionBoxes.length).fill(false);

      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);
        const approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * cv.arcLength(cnt, true), true);

        if (approx.rows === 4 && cv.contourArea(approx) > 100 && cv.isContourConvex(approx) < 200) {
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

     detectAndCropPaper() {
      alert('detectAndCropPaper called');
      try {
        const canvas = this.canvasRef.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          alert('No canvas context');
          return;
        }
        // Read image from canvas
        const src = cv.imread(canvas);
        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);

        // Find marker corners in each detection region
        const markerCorners: {x: number, y: number}[] = [];
        for (const box of this.detectionBoxes) {
          const roi = gray.roi(new cv.Rect(box.x, box.y, box.width, box.height));
          const roiContours = new cv.MatVector();
          const roiHierarchy = new cv.Mat();
          cv.Canny(roi, roi, 75, 150);
          cv.findContours(roi, roiContours, roiHierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

          // Find the largest quadrilateral contour in this region
          let maxArea = 0;
          let bestQuad: any = null;
          for (let i = 0; i < roiContours.size(); i++) {
            const cnt = roiContours.get(i);
            const approx = new cv.Mat();
            cv.approxPolyDP(cnt, approx, 0.02 * cv.arcLength(cnt, true), true);
            if (approx.rows === 4 && cv.isContourConvex(approx)) {
              const area = cv.contourArea(approx);
              if (area > maxArea) {
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

          // Pick the corner of the quad that is closest to the logical region corner
          if (bestQuad) {
            // For each region, pick the logical corner:
            // 0: top-left, 1: bottom-left, 2: top-right, 3: bottom-right
            let target;
            if (box.x < canvas.width / 2 && box.y < canvas.height / 2) target = { x: box.x, y: box.y }; // top-left
            else if (box.x < canvas.width / 2) target = { x: box.x, y: box.y + box.height }; // bottom-left
            else if (box.y < canvas.height / 2) target = { x: box.x + box.width, y: box.y }; // top-right
            else target = { x: box.x + box.width, y: box.y + box.height }; // bottom-right

            // Find the quad point closest to the target
            let minDist = Infinity, chosen = bestQuad[0];
            for (const pt of bestQuad) {
              const dist = Math.hypot(pt.x - target.x, pt.y - target.y);
              if (dist < minDist) {
                minDist = dist;
                chosen = pt;
              }
            }
            markerCorners.push(chosen);
          } else {
            // Fallback: use box corner
            markerCorners.push({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
          }

          roi.delete();
          roiContours.delete();
          roiHierarchy.delete();
        }
        gray.delete();

        if (markerCorners.length !== 4) {
          console.error('Could not detect all marker corners');
          return;
        }

        // Order corners: [top-left, top-right, bottom-right, bottom-left]
        // You may need to sort markerCorners based on their positions
        markerCorners.sort((a: any, b: any) => a.y - b.y);

        const top = markerCorners.slice(0, 2).sort((a, b) => a.x - b.x);
        const bottom = markerCorners.slice(2, 4).sort((a, b) => a.x - b.x);
        const ordered = [top[0], top[1], bottom[1], bottom[0]];

        // Perspective transform
        const FIXED_WIDTH = 800;
        const FIXED_HEIGHT = Math.round(800 * 1.414); // A4 ratio

        const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
          ordered[0].x, ordered[0].y, // top-left
          ordered[1].x, ordered[1].y, // top-right
          ordered[2].x, ordered[2].y, // bottom-right
          ordered[3].x, ordered[3].y  // bottom-left
        ]);
        const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0,
          FIXED_WIDTH, 0,
          FIXED_WIDTH, FIXED_HEIGHT,
          0, FIXED_HEIGHT
        ]);
        const M = cv.getPerspectiveTransform(srcPoints, dstPoints);
        const dst = new cv.Mat();
        const dsize = new cv.Size(FIXED_WIDTH, FIXED_HEIGHT);
        cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
        this.latestWarpedMat = dst.clone(); // 👈 Add this line


        // Draw result on canvas
        canvas.width = FIXED_WIDTH;
        canvas.height = FIXED_HEIGHT;
        cv.imshow(canvas, dst);
                
        // 🆕 STEP: Crop the header from the warped image
        const HEADER_HEIGHT = 250; // You can adjust this
        const headerMat = dst.roi(new cv.Rect(0, 0, dst.cols, HEADER_HEIGHT));

        // Convert to base64 using temporary canvas
        const headerCanvas = document.createElement('canvas');
        headerCanvas.width = headerMat.cols;
        headerCanvas.height = headerMat.rows;
        cv.imshow(headerCanvas, headerMat);
        this.croppedHeaderBase64 = headerCanvas.toDataURL('image/jpeg');

        // Optional debug
        alert('🧠 Header cropped & saved to base64. Length: ' + this.croppedHeaderBase64.length);

        // Now store full scan data locally (you may want to move this to a saveResult() method later)
        const scanData = {
          id: Date.now(), // or uuid
          headerImage: this.croppedHeaderBase64,
          fullImage: canvas.toDataURL('image/jpeg'),
          answers: this.results,
          score: this.score,
          total: this.total,
          subjectId: this.subjectId,
          classId: this.classId,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('scan_' + scanData.id, JSON.stringify(scanData));
        // Get the context again after imshow
        
        const overlayCtx = canvas.getContext('2d');
        if (overlayCtx) {
          // After cropping and perspective transform:

      // 🧪 Show data before drawing overlay
      alert('Loaded answer key: ' + JSON.stringify(this.answerKey));
      alert('Results after processSheet: ' + JSON.stringify(this.results?.slice(0, 3))); // first 3 results for quick check

      this.processSheet(overlayCtx);
      this.drawBubbleOverlay(overlayCtx);  // Must come after drawing the image


          overlayCtx.font = 'bold 32px Arial';
          overlayCtx.fillStyle = 'black';
          overlayCtx.fillText(`Score: ${this.score} / ${this.total}`, 20, 50);
        }

        // Clean up
        src.delete();
        dst.delete();
        srcPoints.delete();
        dstPoints.delete();
        M.delete();

        alert('Cropped image set, showCroppedImage: ' + this.showCroppedImage + ', croppedImageUrl: ' + this.croppedImageUrl);

      } catch (err) {
        const errorMessage = (err as Error).message; // Cast err to Error
        alert('Error in detectAndCropPaper: ' + errorMessage);
        this.ngZone.run(() => {
            this.showCroppedImage = false;
            this.croppedImageUrl = null;
            this.hasResults = false;
        });
    }
  }
  drawBubbleOverlay(ctx: CanvasRenderingContext2D) {
    if (!this.results || !bubbles) return;
  
    // Draw all bubbles in light gray (base layer)
    for (const bubble of bubbles) {
      for (const opt of ['A', 'B', 'C', 'D'] as Option[]) {
        const coord = bubble.options[opt];
        ctx.strokeStyle = 'gray';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(coord.cx, coord.cy, coord.radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
    // Draw overlays based on result
    for (const result of this.results) {
      const bubble = bubbles.find(b => b.question === result.question);
      if (!bubble) continue;
  
      const { marked, correctAnswer, correct } = result;
  
      if (marked && correct) {
        // ✅ Correct answer: GREEN
        const coord = bubble.options[marked];
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(coord.cx, coord.cy, coord.radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (marked && !correct) {
        // ❌ Wrong answer: RED
        const coord = bubble.options[marked];
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(coord.cx, coord.cy, coord.radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
      if (!marked && correctAnswer) {
        // ⚠️ Unanswered but should have been answered: YELLOW
        const coord = bubble.options[correctAnswer];
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(coord.cx, coord.cy, coord.radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  }
    isBubbleFilled(bubble: BubbleTemplate, option: Option, dst: any): boolean {
  const { cx, cy, radius } = bubble.options[option];

  // Crop region from the warped OpenCV image (dst)
  const x = Math.max(cx - radius, 0);
  const y = Math.max(cy - radius, 0);
  const size = Math.min(radius * 2, dst.cols - x, dst.rows - y);

  const roi = dst.roi(new cv.Rect(x, y, size, size));

  // Convert to grayscale and threshold
  const gray = new cv.Mat();
  cv.cvtColor(roi, gray, cv.COLOR_RGBA2GRAY);

  const THRESHOLD_DARKNESS = 180;
  const FILL_PERCENT = 0.3;

  let darkPixels = 0;
  for (let i = 0; i < gray.rows; i++) {
    for (let j = 0; j < gray.cols; j++) {
      const pixel = gray.ucharPtr(i, j)[0];
      if (pixel < THRESHOLD_DARKNESS) {
        darkPixels++;
      }
    }
  }

  const totalPixels = gray.rows * gray.cols;
  gray.delete();
  roi.delete();

  return (darkPixels / totalPixels) > FILL_PERCENT;
    }
    processSheet(ctx: CanvasRenderingContext2D) {
      this.detectedAnswers = {};
      this.results = [];
      this.score = 0;
      this.total = bubbles.length;
    
      for (const bubble of bubbles) {
        const qNum = bubble.question;
        let selected: Option | null = null;
        let filledCount = 0;
    
        for (const opt in bubble.options) {
          const option = opt as Option;
          if (this.isBubbleFilled(bubble, option, this.latestWarpedMat)) {
            filledCount++;
            selected = option;
          }
        }
    
        // Record detected answer
        this.detectedAnswers[qNum.toString()] = filledCount === 1 ? selected : null;
    
        // Get correct answer from key and validate it
        const correctAnswerRaw = this.answerKey[qNum]; // string
        const correctAnswer: Option | null = isOption(correctAnswerRaw) ? correctAnswerRaw : null;
    
        const isCorrect = filledCount === 1 && selected !== null && selected === correctAnswer;
    
        if (isCorrect) {
          this.score++;
        }
    
        this.results.push({
          question: qNum,
          marked: filledCount === 1 ? selected : null,
          correctAnswer,
          correct: isCorrect
        });
      }
    
      this.studentPercentage = (this.score / this.total) * 100;
    
      // TEMP CLASS AVG - can be updated later
      const classScores = [85, 76, 92, 88];
      this.classAveragePercentage = classScores.reduce((a, b) => a + b, 0) / classScores.length;
    
      this.hasResults = true;
      this.goToResultViewer();
    }
    
    reset() {
        this.showCamera = false;
        this.showCroppedImage = false;
        this.croppedImageUrl = null;
        if (this.videoRef && this.videoRef.nativeElement && this.videoRef.nativeElement.srcObject) {
          const stream = this.videoRef.nativeElement.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          this.videoRef.nativeElement.srcObject = null;
        }
      }


  renderChart() {
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

    alert('Chart Data: ' + JSON.stringify(answerCounts));

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
            text: 'Answer Distribution per Question',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
            title: {
              display: true,
              text: 'Number of Students',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Questions',
            },
          },
        },
      },
    });
  }

  // Call renderChart() after processing results
  processResultsAndShowChart() {
    // ... your logic to fill detectedAnswers/results ...
    this.renderChart();
  }
}

