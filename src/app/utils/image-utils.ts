declare const cv: any;

export function calculateBlackBoxDarkness(imageData: ImageData): number {
  let total = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const avg = (r + g + b) / 3;
    total += avg;
  }
  return total / (imageData.data.length / 4);
}

export function preprocessImage(src: any): any {
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edged = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
  cv.Canny(blurred, edged, 75, 200);

  gray.delete();
  blurred.delete();

  return edged;
}

export function cropAndWarpImage(src: any, edged: any): { warpedMat: any } | null {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  cv.findContours(edged, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

  let maxArea = 0;
  let pageContour = null;

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    if (area > maxArea) {
      const peri = cv.arcLength(contour, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, 0.02 * peri, true);
      if (approx.rows === 4) {
        pageContour = approx.clone();
        maxArea = area;
      }
      approx.delete();
    }
    contour.delete();
  }

  if (!pageContour) {
    contours.delete();
    hierarchy.delete();
    return null;
  }

  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    ...pageContour.data32F
  ]);

  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    700, 0,
    700, 1000,
    0, 1000
  ]);

  const M = cv.getPerspectiveTransform(srcTri, dstTri);
  const dsize = new cv.Size(700, 1000);
  const warpedMat = new cv.Mat();

  cv.warpPerspective(src, warpedMat, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

  pageContour.delete();
  srcTri.delete();
  dstTri.delete();
  M.delete();
  contours.delete();
  hierarchy.delete();

  return { warpedMat };
}
