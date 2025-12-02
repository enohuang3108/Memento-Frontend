/**
 * Test Image Library
 *
 * Centralized management of test images for E2E upload tests.
 * Provides type-safe access to test fixtures with metadata.
 */

import { readFileSync } from 'fs'
import { join } from 'path'

export interface TestImage {
  /** File name in fixtures directory */
  filename: string
  /** MIME type */
  mimeType: string
  /** Expected width (if known) */
  width?: number
  /** Expected height (if known) */
  height?: number
  /** Description of the image */
  description: string
  /** Approximate file size in bytes */
  sizeBytes?: number
}

/**
 * Available test images
 */
export const TEST_IMAGES = {
  /** JPEG mountain landscape from Unsplash */
  JPEG: {
    filename: 'test-image.jpg',
    mimeType: 'image/jpeg',
    width: 800,
    height: 600,
    description: 'Mountain landscape (JPEG)',
    sizeBytes: 78845,
  } as TestImage,

  /** PNG nature scene from Unsplash */
  PNG: {
    filename: 'test-image.png',
    mimeType: 'image/png',
    width: 800,
    height: 600,
    description: 'Nature scene (PNG)',
    sizeBytes: 534000,
  } as TestImage,

  /** Animated GIF from Wikipedia */
  GIF: {
    filename: 'test-image-gif.gif',
    mimeType: 'image/gif',
    description: 'Rotating earth animation (GIF)',
    sizeBytes: 1001718,
  } as TestImage,

  /** WebP sample from Google */
  WEBP: {
    filename: 'test-image-webp.webp',
    mimeType: 'image/webp',
    width: 550,
    height: 368,
    description: 'WebP sample image',
    sizeBytes: 30320,
  } as TestImage,
} as const

/**
 * Get the absolute path to a test image
 */
export function getTestImagePath(image: TestImage): string {
  return join(process.cwd(), 'tests/fixtures', image.filename)
}

/**
 * Read a test image as a buffer
 */
export function readTestImage(image: TestImage): Buffer {
  const path = getTestImagePath(image)
  return readFileSync(path)
}

/**
 * Get all supported image formats for testing
 */
export function getAllTestImages(): TestImage[] {
  return Object.values(TEST_IMAGES)
}

/**
 * Get test images by MIME type
 */
export function getTestImagesByType(mimeType: string): TestImage[] {
  return getAllTestImages().filter((img) => img.mimeType === mimeType)
}

/**
 * Create a test file object for Playwright
 */
export function createTestFile(image: TestImage, customName?: string) {
  const buffer = readTestImage(image)
  return {
    file: {
      name: customName || image.filename,
      mimeType: image.mimeType,
      buffer,
    },
  }
}
