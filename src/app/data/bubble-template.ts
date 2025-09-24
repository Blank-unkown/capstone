
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
  { question: 7, options: { A: { cx: 100, cy: 505, radius: 15 }, B: { cx: 140, cy: 505, radius: 15 }, C: { cx: 180, cy: 505, radius: 15 }, D: { cx: 215, cy: 505, radius: 15 } } },
  { question: 8, options: { A: { cx: 100, cy: 545, radius: 15 }, B: { cx: 140, cy: 545, radius: 15 }, C: { cx: 180, cy: 545, radius: 15 }, D: { cx: 215, cy: 545, radius: 15 } } },
  { question: 9, options: { A: { cx: 100, cy: 585, radius: 15 }, B: { cx: 140, cy: 585, radius: 15 }, C: { cx: 180, cy: 585, radius: 15 }, D: { cx: 215, cy: 585, radius: 15 } } },
  { question: 10, options: { A: { cx: 100, cy: 625, radius: 15 }, B: { cx: 140, cy: 625, radius: 15 }, C: { cx: 180, cy: 625, radius: 15 }, D: { cx: 215, cy: 625, radius: 15 } } },

  // Column 2: Q11–20
  { question: 11, options: { A: { cx: 360, cy: 250, radius: 15 }, B: { cx: 400, cy: 250, radius: 15 }, C: { cx: 435, cy: 250, radius: 15 }, D: { cx: 465, cy: 250, radius: 15 } } },
  { question: 12, options: { A: { cx: 360, cy: 295, radius: 15 }, B: { cx: 400, cy: 295, radius: 15 }, C: { cx: 435, cy: 295, radius: 15 }, D: { cx: 465, cy: 295, radius: 15 } } },
  { question: 13, options: { A: { cx: 360, cy: 340, radius: 15 }, B: { cx: 400, cy: 340, radius: 15 }, C: { cx: 435, cy: 340, radius: 15 }, D: { cx: 465, cy: 340, radius: 15 } } },
  { question: 14, options: { A: { cx: 360, cy: 385, radius: 15 }, B: { cx: 400, cy: 385, radius: 15 }, C: { cx: 435, cy: 385, radius: 15 }, D: { cx: 465, cy: 385, radius: 15 } } },
  { question: 15, options: { A: { cx: 360, cy: 425, radius: 15 }, B: { cx: 400, cy: 425, radius: 15 }, C: { cx: 435, cy: 425, radius: 15 }, D: { cx: 465, cy: 425, radius: 15 } } },
  { question: 16, options: { A: { cx: 360, cy: 465, radius: 15 }, B: { cx: 400, cy: 465, radius: 15 }, C: { cx: 435, cy: 465, radius: 15 }, D: { cx: 465, cy: 465, radius: 15 } } },
  { question: 17, options: { A: { cx: 360, cy: 505, radius: 15 }, B: { cx: 400, cy: 505, radius: 15 }, C: { cx: 435, cy: 505, radius: 15 }, D: { cx: 465, cy: 505, radius: 15 } } },
  { question: 18, options: { A: { cx: 360, cy: 545, radius: 15 }, B: { cx: 400, cy: 545, radius: 15 }, C: { cx: 435, cy: 545, radius: 15 }, D: { cx: 465, cy: 545, radius: 15 } } },
  { question: 19, options: { A: { cx: 360, cy: 585, radius: 15 }, B: { cx: 400, cy: 585, radius: 15 }, C: { cx: 435, cy: 585, radius: 15 }, D: { cx: 465, cy: 585, radius: 15 } } },
  { question: 20, options: { A: { cx: 360, cy: 625, radius: 15 }, B: { cx: 400, cy: 625, radius: 15 }, C: { cx: 435, cy: 625, radius: 15 }, D: { cx: 465, cy: 625, radius: 15 } } },

  // Column 3: Q21–30
  { question: 21, options: { A: { cx: 610, cy: 250, radius: 15 }, B: { cx: 650, cy: 250, radius: 15 }, C: { cx: 690, cy: 250, radius: 15 }, D: { cx: 730, cy: 250, radius: 15 } } },
  { question: 22, options: { A: { cx: 610, cy: 295, radius: 15 }, B: { cx: 650, cy: 295, radius: 15 }, C: { cx: 690, cy: 295, radius: 15 }, D: { cx: 730, cy: 295, radius: 15 } } },
  { question: 23, options: { A: { cx: 610, cy: 340, radius: 15 }, B: { cx: 650, cy: 340, radius: 15 }, C: { cx: 690, cy: 340, radius: 15 }, D: { cx: 730, cy: 340, radius: 15 } } },
  { question: 24, options: { A: { cx: 610, cy: 385, radius: 15 }, B: { cx: 650, cy: 385, radius: 15 }, C: { cx: 690, cy: 385, radius: 15 }, D: { cx: 730, cy: 385, radius: 15 } } },
  { question: 25, options: { A: { cx: 610, cy: 425, radius: 15 }, B: { cx: 650, cy: 425, radius: 15 }, C: { cx: 690, cy: 425, radius: 15 }, D: { cx: 730, cy: 425, radius: 15 } } },
  { question: 26, options: { A: { cx: 610, cy: 465, radius: 15 }, B: { cx: 650, cy: 465, radius: 15 }, C: { cx: 690, cy: 465, radius: 15 }, D: { cx: 730, cy: 465, radius: 15 } } },
  { question: 27, options: { A: { cx: 610, cy: 505, radius: 15 }, B: { cx: 650, cy: 505, radius: 15 }, C: { cx: 690, cy: 505, radius: 15 }, D: { cx: 730, cy: 505, radius: 15 } } },
  { question: 28, options: { A: { cx: 610, cy: 545, radius: 15 }, B: { cx: 650, cy: 545, radius: 15 }, C: { cx: 690, cy: 545, radius: 15 }, D: { cx: 730, cy: 545, radius: 15 } } },
  { question: 29, options: { A: { cx: 610, cy: 585, radius: 15 }, B: { cx: 650, cy: 585, radius: 15 }, C: { cx: 690, cy: 585, radius: 15 }, D: { cx: 730, cy: 585, radius: 15 } } },
  { question: 30, options: { A: { cx: 610, cy: 625, radius: 15 }, B: { cx: 650, cy: 625, radius: 15 }, C: { cx: 690, cy: 625, radius: 15 }, D: { cx: 730, cy: 625, radius: 15 } } },

  // Column 4: Q31–40 (+10 cx)
  { question: 31, options: { A: { cx: 110, cy: 705, radius: 15 }, B: { cx: 150, cy: 705, radius: 15 }, C: { cx: 190, cy: 705, radius: 15 }, D: { cx: 225, cy: 705, radius: 15 } } },
  { question: 32, options: { A: { cx: 110, cy: 745, radius: 15 }, B: { cx: 150, cy: 745, radius: 15 }, C: { cx: 190, cy: 745, radius: 15 }, D: { cx: 225, cy: 745, radius: 15 } } },
  { question: 33, options: { A: { cx: 110, cy: 785, radius: 15 }, B: { cx: 150, cy: 785, radius: 15 }, C: { cx: 190, cy: 785, radius: 15 }, D: { cx: 225, cy: 785, radius: 15 } } },
  { question: 34, options: { A: { cx: 110, cy: 830, radius: 15 }, B: { cx: 150, cy: 830, radius: 15 }, C: { cx: 190, cy: 830, radius: 15 }, D: { cx: 225, cy: 830, radius: 15 } } },
  { question: 35, options: { A: { cx: 110, cy: 870, radius: 15 }, B: { cx: 150, cy: 870, radius: 15 }, C: { cx: 190, cy: 870, radius: 15 }, D: { cx: 225, cy: 870, radius: 15 } } },
  { question: 36, options: { A: { cx: 110, cy: 910, radius: 15 }, B: { cx: 150, cy: 910, radius: 15 }, C: { cx: 190, cy: 910, radius: 15 }, D: { cx: 225, cy: 910, radius: 15 } } },
  { question: 37, options: { A: { cx: 110, cy: 950, radius: 15 }, B: { cx: 150, cy: 950, radius: 15 }, C: { cx: 190, cy: 950, radius: 15 }, D: { cx: 225, cy: 950, radius: 15 } } },
  { question: 38, options: { A: { cx: 110, cy: 990, radius: 15 }, B: { cx: 150, cy: 990, radius: 15 }, C: { cx: 190, cy: 990, radius: 15 }, D: { cx: 225, cy: 990, radius: 15 } } },
  { question: 39, options: { A: { cx: 110, cy: 1030, radius: 15 }, B: { cx: 150, cy: 1030, radius: 15 }, C: { cx: 190, cy: 1030, radius: 15 }, D: { cx: 225, cy: 1030, radius: 15 } } },
  { question: 40, options: { A: { cx: 110, cy: 1070, radius: 15 }, B: { cx: 150, cy: 1070, radius: 15 }, C: { cx: 190, cy: 1070, radius: 15 }, D: { cx: 225, cy: 1070, radius: 15 } } },

  // Column 5: Q41–50
  { question: 41, options: { A: { cx: 350, cy: 700, radius: 15 }, B: { cx: 390, cy: 700, radius: 15 }, C: { cx: 430, cy: 700, radius: 15 }, D: { cx: 465, cy: 700, radius: 15 } } },
  { question: 42, options: { A: { cx: 350, cy: 740, radius: 15 }, B: { cx: 390, cy: 740, radius: 15 }, C: { cx: 430, cy: 740, radius: 15 }, D: { cx: 465, cy: 740, radius: 15 } } },
  { question: 43, options: { A: { cx: 350, cy: 780, radius: 15 }, B: { cx: 390, cy: 780, radius: 15 }, C: { cx: 430, cy: 780, radius: 15 }, D: { cx: 465, cy: 780, radius: 15 } } },
  { question: 44, options: { A: { cx: 350, cy: 830, radius: 15 }, B: { cx: 390, cy: 830, radius: 15 }, C: { cx: 430, cy: 830, radius: 15 }, D: { cx: 465, cy: 830, radius: 15 } } },
  { question: 45, options: { A: { cx: 350, cy: 870, radius: 15 }, B: { cx: 390, cy: 870, radius: 15 }, C: { cx: 430, cy: 870, radius: 15 }, D: { cx: 465, cy: 870, radius: 15 } } },
  { question: 46, options: { A: { cx: 350, cy: 910, radius: 15 }, B: { cx: 390, cy: 910, radius: 15 }, C: { cx: 430, cy: 910, radius: 15 }, D: { cx: 465, cy: 910, radius: 15 } } },
  { question: 47, options: { A: { cx: 350, cy: 950, radius: 15 }, B: { cx: 390, cy: 950, radius: 15 }, C: { cx: 430, cy: 950, radius: 15 }, D: { cx: 465, cy: 950, radius: 15 } } },
  { question: 48, options: { A: { cx: 350, cy: 990, radius: 15 }, B: { cx: 390, cy: 990, radius: 15 }, C: { cx: 430, cy: 990, radius: 15 }, D: { cx: 465, cy: 990, radius: 15 } } },
  { question: 49, options: { A: { cx: 350, cy: 1030, radius: 15 }, B: { cx: 390, cy: 1030, radius: 15 }, C: { cx: 430, cy: 1030, radius: 15 }, D: { cx: 465, cy: 1030, radius: 15 } } },
  { question: 50, options: { A: { cx: 350, cy: 1070, radius: 15 }, B: { cx: 390, cy: 1070, radius: 15 }, C: { cx: 430, cy: 1070, radius: 15 }, D: { cx: 465, cy: 1070, radius: 15 } } },

  ];
