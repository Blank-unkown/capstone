// scan-helpers.ts
// Helper functions for scan.page.ts using OpenCV.js global (not imported as a module)
declare const cv: any;


export function findBlackBoxContours(src: any): any[] {
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const thresh = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
  cv.threshold(blurred, thresh, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  const boxes = [];
  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const peri = cv.arcLength(cnt, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

    if (approx.rows === 4 && cv.contourArea(approx) > 1000) {
      boxes.push(approx);
    } else {
      approx.delete();
    }
    cnt.delete();
  }

  gray.delete();
  blurred.delete();
  thresh.delete();
  hierarchy.delete();
  contours.delete();

  return boxes;
}

export function sortBoxesClockwise(boxes: any[]): any {
  const pts = boxes.map(mat => mat.data32S);
  const flat = pts.flat();
  const points = [];
  for (let i = 0; i < flat.length; i += 2) {
    points.push({ x: flat[i], y: flat[i + 1] });
  }

  // Sort: top-left, top-right, bottom-right, bottom-left
  points.sort((a, b) => a.y - b.y);
  const top = points.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottom = points.slice(2, 4).sort((a, b) => b.x - a.x);
  const sorted = [...top, ...bottom];

  const dst = cv.matFromArray(4, 1, cv.CV_32FC2, sorted.flatMap(p => [p.x, p.y]));
  return dst;
}

export function warpToTopDown(src: any, sortedPoints: any): any {
  const [tl, tr, br, bl] = Array.from({ length: 4 }, (_, i) => new cv.Point(sortedPoints.data32F[i * 2], sortedPoints.data32F[i * 2 + 1]));

  const widthA = Math.hypot(br.x - bl.x, br.y - bl.y);
  const widthB = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const maxWidth = Math.max(Math.floor(widthA), Math.floor(widthB));

  const heightA = Math.hypot(tr.x - br.x, tr.y - br.y);
  const heightB = Math.hypot(tl.x - bl.x, tl.y - bl.y);
  const maxHeight = Math.max(Math.floor(heightA), Math.floor(heightB));

  const dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    maxWidth - 1, 0,
    maxWidth - 1, maxHeight - 1,
    0, maxHeight - 1
  ]);

  const M = cv.getPerspectiveTransform(sortedPoints, dstCoords);
  const dst = new cv.Mat();
  cv.warpPerspective(src, dst, M, new cv.Size(maxWidth, maxHeight));

  M.delete();
  dstCoords.delete();

  return dst;
}

export function isBubbleFilled(mask: any): boolean {
  const nonZero = cv.countNonZero(mask);
  const total = mask.rows * mask.cols;
  const ratio = nonZero / total;
  return ratio > 0.5; // adjustable threshold
}
