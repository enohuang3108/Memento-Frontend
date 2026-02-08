/**
 * PWA Icons and OG Image Generator
 *
 * 從 favicon.webp 生成各尺寸的 PWA icons 和 OG 分享圖片
 *
 * 使用方式：
 *   pnpm generate:icons
 */

/* eslint-disable no-undef */
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas'
import { writeFileSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'

const PUBLIC_DIR = join(import.meta.dirname, '../public')
const SOURCE_ICON = join(PUBLIC_DIR, 'favicon.webp')

async function generateIcons() {
  console.log('Generating PWA icons...')

  const source = sharp(SOURCE_ICON)

  // PWA icons (transparent background, centered)
  await source
    .clone()
    .resize(192, 192)
    .png()
    .toFile(join(PUBLIC_DIR, 'icon-192.png'))
  console.log('  ✓ icon-192.png')

  await source
    .clone()
    .resize(512, 512)
    .png()
    .toFile(join(PUBLIC_DIR, 'icon-512.png'))
  console.log('  ✓ icon-512.png')

  await source
    .clone()
    .resize(180, 180)
    .png()
    .toFile(join(PUBLIC_DIR, 'apple-touch-icon.png'))
  console.log('  ✓ apple-touch-icon.png')

  // Maskable icon (with padding for safe zone)
  const maskableSize = 512
  const iconSize = Math.floor(maskableSize * 0.7) // 70% of total, 15% padding each side
  const padding = Math.floor((maskableSize - iconSize) / 2)

  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }, // white
    },
  })
    .composite([
      {
        input: await source.clone().resize(iconSize, iconSize).png().toBuffer(),
        left: padding,
        top: padding,
      },
    ])
    .png()
    .toFile(join(PUBLIC_DIR, 'maskable-icon-512.png'))
  console.log('  ✓ maskable-icon-512.png')

  console.log('✅ PWA icons generated')
}

async function generateOgImage() {
  console.log('\nGenerating OG image...')

  // 載入 LINESeed 字體
  GlobalFonts.registerFromPath(
    join(PUBLIC_DIR, 'LINESeedTW_OTF_Bd.woff2'),
    'LINESeed'
  )
  GlobalFonts.registerFromPath(
    join(PUBLIC_DIR, 'LINESeedTW_OTF_Rg.woff2'),
    'LINESeed'
  )
  console.log('  ✓ LINESeed fonts loaded')

  const width = 1200
  const height = 630
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Background: cream color (#FFFDF6)
  ctx.fillStyle = '#FFFDF6'
  ctx.fillRect(0, 0, width, height)

  // Load and draw logo
  const logo = await loadImage(SOURCE_ICON)
  const logoSize = 200
  ctx.drawImage(logo, (width - logoSize) / 2, 140, logoSize, logoSize)

  // Title text
  ctx.fillStyle = '#1F2937'
  ctx.font = 'bold 72px LINESeed'
  ctx.textAlign = 'center'
  ctx.fillText('Memento', width / 2, 420)

  // Subtitle
  ctx.fillStyle = '#6B7280'
  ctx.font = '36px LINESeed'
  ctx.fillText('專屬即時照片牆', width / 2, 490)

  const buffer = canvas.toBuffer('image/png')
  writeFileSync(join(PUBLIC_DIR, 'og-image.png'), buffer)
  console.log('  ✓ og-image.png (1200x630)')

  console.log('✅ OG image generated')
}

async function main() {
  console.log('='.repeat(50))
  console.log('Memento Icon Generator')
  console.log('='.repeat(50))
  console.log()

  await generateIcons()
  await generateOgImage()

  console.log()
  console.log('='.repeat(50))
  console.log('All assets generated successfully!')
  console.log('='.repeat(50))
}

main().catch((err) => {
  console.error('Failed to generate icons:', err)
  process.exit(1)
})
