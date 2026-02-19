/**
 * Illustration Types and Constants
 * Defines data structures for the polaroid illustration editor
 */

export interface Illustration {
  id: string;
  src: string;
  x: number; // 0-100 (percentage)
  y: number; // 0-100 (percentage)
  scale: number; // default 1
  rotation: number; // degrees, default 0
  color: string; // hex color
}

export const COLOR_PALETTE = [
  "#ef4444", // 紅
  "#f472b6", // 粉紅
  "#fb923c", // 橘
  "#facc15", // 黃
  "#4ade80", // 綠
  "#38bdf8", // 藍
  "#a78bfa", // 紫
  "#1e293b", // 黑
  "#ffffff", // 白
] as const;

export const DEFAULT_COLOR: string = COLOR_PALETTE[0];

export const ILLUSTRATION_LIST = [
  { id: "flower", src: "/assets/illustrations/flower.svg", name: "花朵" },
  { id: "1", src: "/assets/illustrations/1.svg", name: "圖案 1" },
  { id: "2", src: "/assets/illustrations/2.svg", name: "圖案 2" },
  { id: "3", src: "/assets/illustrations/3.svg", name: "圖案 3" },
  { id: "4", src: "/assets/illustrations/4.svg", name: "圖案 4" },
  { id: "5", src: "/assets/illustrations/5.svg", name: "圖案 5" },
  { id: "6", src: "/assets/illustrations/6.svg", name: "圖案 6" },
  { id: "arrow-1", src: "/assets/illustrations/arrow-1.svg", name: "箭頭 1" },
  { id: "arrow-8", src: "/assets/illustrations/arrow-8.svg", name: "箭頭 2" },
  { id: "arrow-40", src: "/assets/illustrations/arrow-40.svg", name: "箭頭 3" },
  { id: "doodle-1", src: "/assets/illustrations/doodle_1.svg", name: "塗鴉 1" },
  {
    id: "doodle-142",
    src: "/assets/illustrations/doodle_142.svg",
    name: "塗鴉 2",
  },
  {
    id: "doodle-156",
    src: "/assets/illustrations/doodle_156.svg",
    name: "塗鴉 3",
  },
  {
    id: "doodle-157",
    src: "/assets/illustrations/doodle_157.svg",
    name: "塗鴉 4",
  },
  {
    id: "doodle-158",
    src: "/assets/illustrations/doodle_158.svg",
    name: "塗鴉 5",
  },
  {
    id: "underline",
    src: "/assets/illustrations/underline_25.svg",
    name: "底線",
  },
] as const;

export function createIllustration(
  src: string,
  color: string = DEFAULT_COLOR,
): Illustration {
  return {
    id: `illust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    src,
    x: 50,
    y: 50,
    scale: 1,
    rotation: 0,
    color,
  };
}
