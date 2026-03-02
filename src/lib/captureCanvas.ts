/**
 * Canvas Capture Utility
 * Uses modern-screenshot to capture DOM elements as images
 */

import { domToBlob } from "modern-screenshot";

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

  const blob = await domToBlob(element, {
    scale,
    quality,
    backgroundColor: "#ffffff",
    type: "image/jpeg",
  });

  if (!blob) {
    throw new Error("截圖失敗");
  }

  return blob;
}
