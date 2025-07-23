import { BubbleTemplate } from '../data/bubble-template';

declare const cv: any;

export function processSheet(
  warpedMat: any,
  bubbleTemplate: BubbleTemplate[],
  answerKey: Record<number, string>,
  total: number
): {
  detectedAnswers: Record<number, string>;
  correctCount: number;
} {
  const detectedAnswers: Record<number, string> = {};
  let correctCount = 0;

  for (const bubble of bubbleTemplate) {
    let darkest = 255;
    let selectedAnswer = '';

    for (const [option, coords] of Object.entries(bubble.options)) {
      const roi = warpedMat.roi(
        new cv.Rect(
          coords.cx - coords.radius,
          coords.cy - coords.radius,
          coords.radius * 2,
          coords.radius * 2
        )
      );
      const mean = cv.mean(roi)[0];
      roi.delete();

      if (mean < darkest) {
        darkest = mean;
        selectedAnswer = option;
      }
    }

    detectedAnswers[bubble.question] = selectedAnswer;

    if (selectedAnswer === answerKey[bubble.question]) {
      correctCount++;
    }
  }

  return {
    detectedAnswers,
    correctCount
  };
}
