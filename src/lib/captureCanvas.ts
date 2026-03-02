/**
 * Canvas Capture Utility
 * Uses modern-screenshot to capture DOM elements as images
 */

import { domToBlob } from "modern-screenshot";

export interface CaptureOptions {
  scale?: number;
  quality?: number;
}

/**
 * 將圖片轉換為 data URL
 * iOS Safari 無法在 canvas 中正確繪製 blob URL 圖片
 */
async function imageToDataUrl(img: HTMLImageElement): Promise<string> {
  // 確保圖片已載入
  if (!img.complete || img.naturalWidth === 0) {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("圖片載入失敗"));
    });
  }

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("無法創建 canvas context");
  }

  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}

export async function captureCanvas(
  element: HTMLElement,
  options: CaptureOptions = {},
): Promise<Blob> {
  const { scale = 4, quality = 1 } = options;

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

  // 預先準備所有圖片的 data URL 映射
  // 這是為了在 onCloneNode 中使用
  const dataUrlMap = new Map<string, string>();

  for (const img of Array.from(imgElements)) {
    const originalSrc = img.src;
    // 只處理 blob URL（iOS Safari 的問題源頭）
    if (originalSrc.startsWith("blob:")) {
      try {
        const dataUrl = await imageToDataUrl(img);
        dataUrlMap.set(originalSrc, dataUrl);
        console.log("[DEBUG] 圖片轉換為 data URL:", {
          originalSrc: originalSrc.substring(0, 50),
          dataUrlSizeKB: Math.round(dataUrl.length / 1024),
        });
      } catch (error) {
        console.error("[DEBUG] 圖片轉換失敗:", error);
      }
    }
  }

  console.log("[DEBUG] 開始截圖，使用 onCloneNode 替換圖片");

  const blob = await domToBlob(element, {
    scale,
    quality,
    backgroundColor: "#ffffff",
    type: "image/jpeg",
    onCloneNode: (clonedNode) => {
      // 在克隆的節點中替換圖片 src
      if (clonedNode instanceof HTMLImageElement) {
        const originalSrc = clonedNode.src;
        const dataUrl = dataUrlMap.get(originalSrc);
        if (dataUrl) {
          clonedNode.src = dataUrl;
          console.log("[DEBUG] onCloneNode: 已替換圖片 src");
        }
      }
    },
  });

  console.log("[DEBUG] 截圖完成:", {
    blobSize: blob?.size,
    blobSizeKB: blob ? Math.round(blob.size / 1024) : 0,
    blobType: blob?.type,
  });

  if (!blob) {
    throw new Error("截圖失敗");
  }

  return blob;
}
