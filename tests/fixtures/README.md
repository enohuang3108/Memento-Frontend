# Test Fixtures

This directory contains test images in various formats for E2E upload testing.

## Test Image Library

All test images are managed through the centralized test library at `/tests/lib/testImages.ts`, which provides:
- Type-safe access to test images
- Metadata (dimensions, MIME types, file sizes)
- Helper functions for reading and creating test files
- Consistent API for Playwright tests

## Available Test Images

### test-image.jpg
- **Format**: JPEG
- **Size**: 79 KB
- **Dimensions**: 800x600 pixels
- **Source**: Unsplash (Mountain landscape)
- **URL**: https://images.unsplash.com/photo-1506905925346-21bda4d32df4
- **Use**: JPEG format validation, real photo testing

### test-image.png
- **Format**: PNG
- **Size**: 547 KB
- **Dimensions**: 800x600 pixels
- **Source**: Unsplash (Nature scene)
- **URL**: https://images.unsplash.com/photo-1469474968028-56623f02e42e
- **Use**: PNG format validation, real photo testing

### test-image-gif.gif
- **Format**: GIF
- **Size**: 1.0 MB
- **Dimensions**: Variable (rotating earth animation)
- **Source**: Wikipedia - Rotating Earth (Large)
- **URL**: https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif
- **Use**: Large GIF upload tests, animated GIF support

### test-image-webp.webp
- **Format**: WebP
- **Size**: 30 KB
- **Dimensions**: 550x368 pixels
- **Source**: Google WebP Gallery
- **URL**: https://www.gstatic.com/webp/gallery/1.webp
- **Use**: WebP format validation

## Usage

Import the test library in your tests:

```typescript
import { TEST_IMAGES, createTestFile } from '../../lib/testImages'

// Use in Playwright tests
const response = await request.post('/upload', {
  multipart: {
    ...createTestFile(TEST_IMAGES.JPEG),
    activityId: testActivityId,
  },
})
```

These images are used in `/tests/e2e/api/upload.spec.ts` to test:
- Different image format support (JPEG, PNG, GIF, WebP)
- File size validation
- Batch upload functionality
- Multi-format sequential uploads

## Regenerating Test Images

If you need to regenerate or update test images:

```bash
# Download JPEG from Unsplash
curl -L -o tests/fixtures/test-image.jpg "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"

# Download PNG from Unsplash
curl -L -o tests/fixtures/test-image.png "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&fm=png"

# Download GIF from Wikipedia
curl -o tests/fixtures/test-image-gif.gif "https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif"

# Download WebP from Google
curl -o tests/fixtures/test-image-webp.webp "https://www.gstatic.com/webp/gallery/1.webp"
```
