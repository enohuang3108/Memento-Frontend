/**
 * Canvas Capture Utility
 * Uses modern-screenshot to capture DOM elements as images
 */

import { domToBlob, domToCanvas } from "modern-screenshot";

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

  // 檢查每個 img 的狀態
  imgElements.forEach((img, index) => {
    console.log(`[DEBUG] img[${index}] 狀態:`, {
      src: img.src?.substring(0, 50) + "...",
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      width: img.width,
      height: img.height,
      display: getComputedStyle(img).display,
      visibility: getComputedStyle(img).visibility,
    });
  });

  // 等待字體載入完成
  await document.fonts.ready;
  console.log("[DEBUG] 字體已載入");

  // 等待所有圖片載入完成
  const imgLoadPromises = Array.from(imgElements).map((img) => {
    if (img.complete && img.naturalWidth > 0) {
      console.log("[DEBUG] 圖片已完成載入:", img.src?.substring(0, 50));
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      console.log("[DEBUG] 等待圖片載入:", img.src?.substring(0, 50));
      img.onload = () => {
        console.log("[DEBUG] 圖片載入完成:", img.src?.substring(0, 50));
        resolve();
      };
      img.onerror = () => {
        console.error("[DEBUG] 圖片載入失敗:", img.src?.substring(0, 50));
        reject(new Error("圖片載入失敗"));
      };
    });
  });

  try {
    await Promise.all(imgLoadPromises);
    console.log("[DEBUG] 所有圖片載入完成，開始截圖");
  } catch (error) {
    console.error("[DEBUG] 圖片載入錯誤:", error);
  }

  // 診斷：先用 domToCanvas 看 canvas 內容
  const canvas = await domToCanvas(element, {
    scale,
    backgroundColor: "#ffffff",
  });

  console.log("[DEBUG] Canvas 生成完成:", {
    width: canvas.width,
    height: canvas.height,
  });

  // 檢查 canvas 是否有內容（取樣中心點的像素）
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // 取樣照片區域的像素（假設照片在上半部）
    const sampleY = Math.floor(canvas.height * 0.3);
    const sampleX = Math.floor(canvas.width / 2);
    const pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data;
    console.log("[DEBUG] Canvas 像素取樣 (照片區域):", {
      position: { x: sampleX, y: sampleY },
      rgba: `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]})`,
      isWhite: pixel[0] > 250 && pixel[1] > 250 && pixel[2] > 250,
    });
  }

  const blob = await domToBlob(element, {
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

  if (!blob) {
    throw new Error("截圖失敗");
  }

  return blob;
}
