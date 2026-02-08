/**
 * 網站共用常數
 */

// SSR 時使用 process.env（Cloudflare Workers），本地開發用 import.meta.env
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proc = globalThis as any
const processEnv = proc.process?.env as Record<string, string> | undefined

export const SITE_URL =
  processEnv?.VITE_SITE_URL ||
  import.meta.env.VITE_SITE_URL ||
  'http://localhost:3000'
export const SITE_NAME = 'Memento'
export const SITE_TITLE = 'Memento - 專屬即時照片牆'
export const SITE_DESCRIPTION =
  '打造您的專屬即時照片牆，讓每一刻精彩瞬間即時分享'
