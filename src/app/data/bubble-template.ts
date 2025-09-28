
export type Option = 'A' | 'B' | 'C' | 'D';

export interface BubbleCoordinate {
  cx: number;
  cy: number;
  radius: number; // Add this line to include the radius property
}

export interface BubbleTemplate {
  question: number;
  options: {
    A: BubbleCoordinate;
    B: BubbleCoordinate;
    C: BubbleCoordinate;
    D: BubbleCoordinate;
  };
    topic?: string;       // ✅ added
    competency?: string;  // ✅ added
    level?: string;       // ✅ added
}

// Fixed coordinates for a 20-question sheet (2-column layout)
// Left column: Q1–10, Right column: Q11–20
export const bubbles: BubbleTemplate[] = [
 // Column 1: Q1–10
  { question: 1, options: { A: { cx: 100, cy: 250, radius: 15 }, B: { cx: 140, cy: 250, radius: 15 }, C: { cx: 180, cy: 250, radius: 15 }, D: { cx: 215, cy: 250, radius: 15 } } },
  { question: 2, options: { A: { cx: 100, cy: 295, radius: 15 }, B: { cx: 140, cy: 295, radius: 15 }, C: { cx: 180, cy: 295, radius: 15 }, D: { cx: 215, cy: 295, radius: 15 } } },
  { question: 3, options: { A: { cx: 100, cy: 340, radius: 15 }, B: { cx: 140, cy: 340, radius: 15 }, C: { cx: 180, cy: 340, radius: 15 }, D: { cx: 215, cy: 340, radius: 15 } } },
  { question: 4, options: { A: { cx: 100, cy: 385, radius: 15 }, B: { cx: 140, cy: 385, radius: 15 }, C: { cx: 180, cy: 385, radius: 15 }, D: { cx: 215, cy: 385, radius: 15 } } },
  { question: 5, options: { A: { cx: 100, cy: 425, radius: 15 }, B: { cx: 140, cy: 425, radius: 15 }, C: { cx: 180, cy: 425, radius: 15 }, D: { cx: 215, cy: 425, radius: 15 } } },
  { question: 6, options: { A: { cx: 100, cy: 465, radius: 15 }, B: { cx: 140, cy: 465, radius: 15 }, C: { cx: 180, cy: 465, radius: 15 }, D: { cx: 215, cy: 465, radius: 15 } } },
  { question: 7, options: { A: { cx: 100, cy: 510, radius: 15 }, B: { cx: 140, cy: 510, radius: 15 }, C: { cx: 180, cy: 510, radius: 15 }, D: { cx: 215, cy: 510, radius: 15 } } },
  { question: 8, options: { A: { cx: 100, cy: 555, radius: 15 }, B: { cx: 140, cy: 555, radius: 15 }, C: { cx: 180, cy: 555, radius: 15 }, D: { cx: 215, cy: 555, radius: 15 } } },
  { question: 9, options: { A: { cx: 100, cy: 600, radius: 15 }, B: { cx: 140, cy: 600, radius: 15 }, C: { cx: 180, cy: 600, radius: 15 }, D: { cx: 215, cy: 600, radius: 15 } } },
  { question: 10, options: { A: { cx: 100, cy: 645, radius: 15 }, B: { cx: 140, cy: 645, radius: 15 }, C: { cx: 180, cy: 645, radius: 15 }, D: { cx: 215, cy: 645, radius: 15 } } },

  // Column 2: Q11–20
  { question: 11, options: { A: { cx: 360, cy: 250, radius: 15 }, B: { cx: 400, cy: 250, radius: 15 }, C: { cx: 435, cy: 250, radius: 15 }, D: { cx: 475, cy: 250, radius: 15 } } },
  { question: 12, options: { A: { cx: 360, cy: 295, radius: 15 }, B: { cx: 400, cy: 295, radius: 15 }, C: { cx: 435, cy: 295, radius: 15 }, D: { cx: 475, cy: 295, radius: 15 } } },
  { question: 13, options: { A: { cx: 360, cy: 340, radius: 15 }, B: { cx: 400, cy: 340, radius: 15 }, C: { cx: 435, cy: 340, radius: 15 }, D: { cx: 475, cy: 340, radius: 15 } } },
  { question: 14, options: { A: { cx: 360, cy: 385, radius: 15 }, B: { cx: 400, cy: 385, radius: 15 }, C: { cx: 435, cy: 385, radius: 15 }, D: { cx: 475, cy: 385, radius: 15 } } },
  { question: 15, options: { A: { cx: 360, cy: 425, radius: 15 }, B: { cx: 400, cy: 425, radius: 15 }, C: { cx: 435, cy: 425, radius: 15 }, D: { cx: 475, cy: 425, radius: 15 } } },
  { question: 16, options: { A: { cx: 360, cy: 465, radius: 15 }, B: { cx: 400, cy: 465, radius: 15 }, C: { cx: 435, cy: 465, radius: 15 }, D: { cx: 475, cy: 465, radius: 15 } } },
  { question: 17, options: { A: { cx: 360, cy: 510, radius: 15 }, B: { cx: 400, cy: 510, radius: 15 }, C: { cx: 435, cy: 510, radius: 15 }, D: { cx: 475, cy: 510, radius: 15 } } },
  { question: 18, options: { A: { cx: 360, cy: 555, radius: 15 }, B: { cx: 400, cy: 555, radius: 15 }, C: { cx: 435, cy: 555, radius: 15 }, D: { cx: 475, cy: 555, radius: 15 } } },
  { question: 19, options: { A: { cx: 360, cy: 600, radius: 15 }, B: { cx: 400, cy: 600, radius: 15 }, C: { cx: 435, cy: 600, radius: 15 }, D: { cx: 475, cy: 600, radius: 15 } } },
  { question: 20, options: { A: { cx: 360, cy: 645, radius: 15 }, B: { cx: 400, cy: 645, radius: 15 }, C: { cx: 435, cy: 645, radius: 15 }, D: { cx: 475, cy: 645, radius: 15 } } },

  // Column 3: Q21–30
  { question: 21, options: { A: { cx: 625, cy: 250, radius: 15 }, B: { cx: 660, cy: 250, radius: 15 }, C: { cx: 695, cy: 250, radius: 15 }, D: { cx: 730, cy: 250, radius: 15 } } },
  { question: 22, options: { A: { cx: 625, cy: 295, radius: 15 }, B: { cx: 660, cy: 295, radius: 15 }, C: { cx: 695, cy: 295, radius: 15 }, D: { cx: 730, cy: 295, radius: 15 } } },
  { question: 23, options: { A: { cx: 625, cy: 340, radius: 15 }, B: { cx: 660, cy: 340, radius: 15 }, C: { cx: 695, cy: 340, radius: 15 }, D: { cx: 730, cy: 340, radius: 15 } } },
  { question: 24, options: { A: { cx: 625, cy: 385, radius: 15 }, B: { cx: 660, cy: 385, radius: 15 }, C: { cx: 695, cy: 385, radius: 15 }, D: { cx: 730, cy: 385, radius: 15 } } },
  { question: 25, options: { A: { cx: 625, cy: 425, radius: 15 }, B: { cx: 660, cy: 425, radius: 15 }, C: { cx: 695, cy: 425, radius: 15 }, D: { cx: 730, cy: 425, radius: 15 } } },
  { question: 26, options: { A: { cx: 625, cy: 465, radius: 15 }, B: { cx: 660, cy: 465, radius: 15 }, C: { cx: 695, cy: 465, radius: 15 }, D: { cx: 730, cy: 465, radius: 15 } } },
  { question: 27, options: { A: { cx: 625, cy: 510, radius: 15 }, B: { cx: 660, cy: 510, radius: 15 }, C: { cx: 695, cy: 510, radius: 15 }, D: { cx: 730, cy: 510, radius: 15 } } },
  { question: 28, options: { A: { cx: 625, cy: 555, radius: 15 }, B: { cx: 660, cy: 555, radius: 15 }, C: { cx: 695, cy: 555, radius: 15 }, D: { cx: 730, cy: 555, radius: 15 } } },
  { question: 29, options: { A: { cx: 625, cy: 600, radius: 15 }, B: { cx: 660, cy: 600, radius: 15 }, C: { cx: 695, cy: 600, radius: 15 }, D: { cx: 730, cy: 600, radius: 15 } } },
  { question: 30, options: { A: { cx: 625, cy: 645, radius: 15 }, B: { cx: 660, cy: 645, radius: 15 }, C: { cx: 695, cy: 645, radius: 15 }, D: { cx: 730, cy: 645, radius: 15 } } },

  // Column 4: Q31–40
  { question: 31, options: { A: { cx: 100, cy: 710, radius: 15 }, B: { cx: 140, cy: 710, radius: 15 }, C: { cx: 180, cy: 710, radius: 15 }, D: { cx: 220, cy: 710, radius: 15 } } },
  { question: 32, options: { A: { cx: 100, cy: 750, radius: 15 }, B: { cx: 140, cy: 750, radius: 15 }, C: { cx: 180, cy: 750, radius: 15 }, D: { cx: 220, cy: 750, radius: 15 } } },
  { question: 33, options: { A: { cx: 100, cy: 790, radius: 15 }, B: { cx: 140, cy: 790, radius: 15 }, C: { cx: 180, cy: 790, radius: 15 }, D: { cx: 220, cy: 790, radius: 15 } } },
  { question: 34, options: { A: { cx: 100, cy: 840, radius: 15 }, B: { cx: 140, cy: 840, radius: 15 }, C: { cx: 180, cy: 840, radius: 15 }, D: { cx: 220, cy: 840, radius: 15 } } },
  { question: 35, options: { A: { cx: 100, cy: 880, radius: 15 }, B: { cx: 140, cy: 880, radius: 15 }, C: { cx: 180, cy: 880, radius: 15 }, D: { cx: 220, cy: 880, radius: 15 } } },
  { question: 36, options: { A: { cx: 100, cy: 920, radius: 15 }, B: { cx: 140, cy: 920, radius: 15 }, C: { cx: 180, cy: 920, radius: 15 }, D: { cx: 220, cy: 920, radius: 15 } } },
  { question: 37, options: { A: { cx: 100, cy: 960, radius: 15 }, B: { cx: 140, cy: 960, radius: 15 }, C: { cx: 180, cy: 960, radius: 15 }, D: { cx: 220, cy: 960, radius: 15 } } },
  { question: 38, options: { A: { cx: 100, cy: 1000, radius: 15 }, B: { cx: 140, cy: 1000, radius: 15 }, C: { cx: 180, cy: 1000, radius: 15 }, D: { cx: 220, cy: 1000, radius: 15 } } },
  { question: 39, options: { A: { cx: 100, cy: 1040, radius: 15 }, B: { cx: 140, cy: 1040, radius: 15 }, C: { cx: 180, cy: 1040, radius: 15 }, D: { cx: 220, cy: 1040, radius: 15 } } },
  { question: 40, options: { A: { cx: 100, cy: 1080, radius: 15 }, B: { cx: 140, cy: 1080, radius: 15 }, C: { cx: 180, cy: 1080, radius: 15 }, D: { cx: 220, cy: 1080, radius: 15 } } },

  // Column 5: Q41–50
  { question: 41, options: { A: { cx: 365, cy: 710, radius: 15 }, B: { cx: 405, cy: 710, radius: 15 }, C: { cx: 440, cy: 710, radius: 15 }, D: { cx: 480, cy: 710, radius: 15 } } },
  { question: 42, options: { A: { cx: 365, cy: 750, radius: 15 }, B: { cx: 405, cy: 750, radius: 15 }, C: { cx: 440, cy: 750, radius: 15 }, D: { cx: 480, cy: 750, radius: 15 } } },
  { question: 43, options: { A: { cx: 365, cy: 790, radius: 15 }, B: { cx: 405, cy: 790, radius: 15 }, C: { cx: 440, cy: 790, radius: 15 }, D: { cx: 480, cy: 790, radius: 15 } } },
  { question: 44, options: { A: { cx: 365, cy: 840, radius: 15 }, B: { cx: 405, cy: 840, radius: 15 }, C: { cx: 440, cy: 840, radius: 15 }, D: { cx: 480, cy: 840, radius: 15 } } },
  { question: 45, options: { A: { cx: 365, cy: 880, radius: 15 }, B: { cx: 405, cy: 880, radius: 15 }, C: { cx: 440, cy: 880, radius: 15 }, D: { cx: 480, cy: 880, radius: 15 } } },
  { question: 46, options: { A: { cx: 365, cy: 920, radius: 15 }, B: { cx: 405, cy: 920, radius: 15 }, C: { cx: 440, cy: 920, radius: 15 }, D: { cx: 480, cy: 920, radius: 15 } } },
  { question: 47, options: { A: { cx: 365, cy: 960, radius: 15 }, B: { cx: 405, cy: 960, radius: 15 }, C: { cx: 440, cy: 960, radius: 15 }, D: { cx: 480, cy: 960, radius: 15 } } },
  { question: 48, options: { A: { cx: 365, cy: 1000, radius: 15 }, B: { cx: 405, cy: 1000, radius: 15 }, C: { cx: 440, cy: 1000, radius: 15 }, D: { cx: 480, cy: 1000, radius: 15 } } },
  { question: 49, options: { A: { cx: 365, cy: 1040, radius: 15 }, B: { cx: 405, cy: 1040, radius: 15 }, C: { cx: 440, cy: 1040, radius: 15 }, D: { cx: 480, cy: 1040, radius: 15 } } },
  { question: 50, options: { A: { cx: 365, cy: 1080, radius: 15 }, B: { cx: 405, cy: 1080, radius: 15 }, C: { cx: 440, cy: 1080, radius: 15 }, D: { cx: 480, cy: 1080, radius: 15 } } },

  ];
