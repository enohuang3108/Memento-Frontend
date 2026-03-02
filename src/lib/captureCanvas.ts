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

  // 診斷：檢查截圖前的狀態
  const imgElements = element.querySelectorAll("img");
  console.log("[DEBUG] captureCanvas - 開始截圖:", {
    elementSize: {
      width: element.offsetWidth,
      height: element.offsetHeight,
    },
    imgCount: imgElements.length,
  });

  // 等待字體載入完成
  await document.fonts.ready;
  console.log("[DEBUG] 字體已載入");

  // iOS Safari 修復：將所有圖片轉換為 inline base64 data URL
  // 這避免了 iOS Safari 在 canvas 繪製外部/blob URL 圖片時的問題
  const originalSrcs: Map<HTMLImageElement, string> = new Map();

  for (const img of Array.from(imgElements)) {
    if (!img.complete || img.naturalWidth === 0) {
      console.log("[DEBUG] 等待圖片載入:", img.src?.substring(0, 50));
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("圖片載入失敗"));
      });
    }

    // 將圖片繪製到 canvas 並轉換為 data URL
    const imgCanvas = document.createElement("canvas");
    imgCanvas.width = img.naturalWidth;
    imgCanvas.height = img.naturalHeight;
    const imgCtx = imgCanvas.getContext("2d");

    if (imgCtx) {
      try {
        imgCtx.drawImage(img, 0, 0);
        const dataUrl = imgCanvas.toDataURL("image/jpeg", 0.92);
        console.log("[DEBUG] 圖片轉換為 data URL:", {
          originalSrc: img.src?.substring(0, 50),
          dataUrlLength: dataUrl.length,
          dataUrlSizeKB: Math.round(dataUrl.length / 1024),
        });

        // 保存原始 src 並替換為 data URL
        originalSrcs.set(img, img.src);
        img.src = dataUrl;

        // 等待新圖片載入
        await new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = () => resolve();
          }
        });
      } catch (error) {
        console.error("[DEBUG] 圖片轉換失敗:", error);
      }
    }
  }

  console.log("[DEBUG] 所有圖片已轉換，開始截圖");

  let blob: Blob | null = null;
  try {
    blob = await domToBlob(element, {
      scale,
      quality,
      backgroundColor: "#ffffff",
      type: "image/jpeg",
    });

    console.log("[DEBUG] 截圖完成:", {
      blobSize: blob?.size,
      blobSizeKB: blob ? Math.round(blob.size / 1024) : 0,
      blobType: blob?.type,
    });
  } finally {
    // 恢復原始的圖片 src
    for (const [img, originalSrc] of originalSrcs) {
      img.src = originalSrc;
    }
    console.log("[DEBUG] 已恢復原始圖片 src");
  }

  if (!blob) {
    throw new Error("截圖失敗");
  }

  return blob;
}
