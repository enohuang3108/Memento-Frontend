/**
 * Canvas Capture Utility
 * Uses html2canvas to capture DOM elements as images
 */

import html2canvas from "html2canvas";

export interface CaptureOptions {
  scale?: number;
  quality?: number;
}

export async function captureCanvas(
  element: HTMLElement,
  options: CaptureOptions = {},
): Promise<Blob> {
  const { scale = 4, quality = 1 } = options;

  // 等待字體載入完成
  await document.fonts.ready;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("截圖失敗"));
        }
      },
      "image/jpeg",
      quality,
    );
  });
}
