/**
 * Canvas Composer
 * Composes a polaroid-style message board image
 */

import type { Illustration } from "./illustrations";

export interface ComposerInput {
  photo: File;
  message: string;
  relation: string;
  locationTime: string;
  illustrations: Illustration[];
}

export interface ComposerResult {
  blob: Blob;
  width: number;
  height: number;
}

const BORDER_RATIO = 0.04;
const BOTTOM_RATIO = 0.25;
const PADDING = 24;
const LINE_HEIGHT = 1.5;
const ILLUSTRATION_BASE_SIZE = 80;

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function loadColoredSvg(
  src: string,
  color: string
): Promise<HTMLImageElement> {
  const response = await fetch(src);
  let svgText = await response.text();

  svgText = svgText.replace(/fill="[^"]*"/g, `fill="${color}"`);
  svgText = svgText.replace(/stroke="[^"]*"/g, `stroke="${color}"`);

  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load SVG: ${src}`));
    };
    img.src = url;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  let currentLine = "";

  for (const char of text) {
    const testLine = currentLine + char;
    if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

export async function composeMessageBoard(
  input: ComposerInput
): Promise<ComposerResult> {
  const { photo, message, relation, locationTime, illustrations } = input;

  // Load photo
  const photoImg = await loadImageFromFile(photo);
  const photoWidth = photoImg.naturalWidth;
  const photoHeight = photoImg.naturalHeight;

  // Calculate dimensions
  const borderSize = Math.round(photoWidth * BORDER_RATIO);
  const canvasWidth = photoWidth + borderSize * 2;
  const bottomAreaHeight = Math.round(canvasWidth * BOTTOM_RATIO);
  const canvasHeight = photoHeight + borderSize + bottomAreaHeight;

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d")!;

  // Layer 1: White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Layer 2: Photo
  ctx.drawImage(photoImg, borderSize, borderSize, photoWidth, photoHeight);

  // Layer 3: Illustrations
  for (const illust of illustrations) {
    try {
      const img = await loadColoredSvg(illust.src, illust.color);
      const size = ILLUSTRATION_BASE_SIZE * illust.scale;

      // Convert percentage to canvas coordinates
      const x = borderSize + (illust.x / 100) * photoWidth;
      const y = borderSize + (illust.y / 100) * photoHeight;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((illust.rotation * Math.PI) / 180);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    } catch (error) {
      console.warn("Failed to draw illustration:", illust.src, error);
    }
  }

  // Layer 4: Text
  const textAreaTop = borderSize + photoHeight;
  const textColor = "#1e293b";

  const baseFontSize = Math.max(14, Math.min(28, canvasWidth / 20));
  const messageFontSize = baseFontSize;
  const relationFontSize = baseFontSize * 0.7;
  const locationFontSize = baseFontSize * 0.55;

  ctx.textBaseline = "top";

  // Message
  if (message) {
    ctx.font = `bold ${messageFontSize}px "LINE Seed TW", sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "left";

    const quotedMessage = `「${message}」`;
    const maxMessageWidth = canvasWidth - PADDING * 2;
    const messageLines = wrapText(ctx, quotedMessage, maxMessageWidth);

    let y = textAreaTop + PADDING;
    for (const line of messageLines) {
      ctx.fillText(line, PADDING, y);
      y += messageFontSize * LINE_HEIGHT;
    }
  }

  // Relation and Location (right aligned at bottom)
  ctx.textAlign = "right";
  const rightX = canvasWidth - PADDING;

  let locationY = canvasHeight - PADDING - locationFontSize;
  if (locationTime) {
    ctx.font = `${locationFontSize}px "LINE Seed TW", sans-serif`;
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.6;
    ctx.fillText(locationTime, rightX, locationY);
    ctx.globalAlpha = 1;
  }

  if (relation) {
    const relationY = locationTime
      ? locationY - relationFontSize * LINE_HEIGHT - 4
      : canvasHeight - PADDING - relationFontSize;

    ctx.font = `${relationFontSize}px "LINE Seed TW", sans-serif`;
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.85;
    ctx.fillText(`─ ${relation}`, rightX, relationY);
    ctx.globalAlpha = 1;
  }

  // Clean up
  URL.revokeObjectURL(photoImg.src);

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({ blob, width: canvasWidth, height: canvasHeight });
        } else {
          reject(new Error("Failed to create blob"));
        }
      },
      "image/jpeg",
      0.92
    );
  });
}
