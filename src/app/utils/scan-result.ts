// scan-result.ts
import { BubbleTemplate } from '../data/bubble-template';

declare const cv: any;

export function drawScanResult(
  canvas: HTMLCanvasElement,
  warpedMat: any,
  template: BubbleTemplate[],
  detectedAnswers: Record<number, string>,
  answerKey: Record<number, string>
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Resize canvas to match warpedMat size
  canvas.width = warpedMat.cols;
  canvas.height = warpedMat.rows;

  const imgData = new ImageData(
    new Uint8ClampedArray(warpedMat.data),
    warpedMat.cols,
    warpedMat.rows
  );
  ctx.putImageData(imgData, 0, 0);

  for (const q of template) {
    const qNum = q.question;
    const selected = detectedAnswers[qNum];
    const correct = answerKey[qNum];

    for (const [opt, coords] of Object.entries(q.options)) {
      ctx.beginPath();
      ctx.arc(coords.cx, coords.cy, coords.radius, 0, 2 * Math.PI);
      ctx.lineWidth = 2;

      if (opt === selected && selected === correct) {
        ctx.strokeStyle = 'green'; // correct
      } else if (opt === selected && selected !== correct) {
        ctx.strokeStyle = 'red'; // incorrect
      } else if (opt === correct) {
        ctx.strokeStyle = 'blue'; // correct answer not selected
      } else {
        ctx.strokeStyle = 'gray'; // other
      }

      ctx.stroke();
    }
  }
}
