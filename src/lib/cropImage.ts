/**
 * Crop image utility using canvas
 * Outputs a cropped image as a File object
 */

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Creates a cropped image from the source image
 * @param imageSrc - The source image URL
 * @param cropArea - The crop area in pixels
 * @param rotation - Rotation in degrees (0, 90, 180, 270)
 * @returns A File object containing the cropped image
 */
export async function cropImage(
  imageSrc: string,
  cropArea: CropArea,
  rotation: number = 0,
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Calculate the bounding box of the rotated image
  const rotRad = (rotation * Math.PI) / 180;
  const { width: bBoxWidth, height: bBoxHeight } = getRotatedBoundingBox(
    image.width,
    image.height,
    rotation,
  );

  // Set canvas size to the crop area
  canvas.width = cropArea.width;
  canvas.height = cropArea.height;

  // Move to the center of the canvas
  ctx.translate(cropArea.width / 2, cropArea.height / 2);

  // Translate back to draw the image
  ctx.translate(-cropArea.x - cropArea.width / 2, -cropArea.y - cropArea.height / 2);

  // Move to center of the bounding box
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);

  // Rotate
  ctx.rotate(rotRad);

  // Draw the image centered
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  // Convert canvas to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas toBlob failed"));
        }
      },
      "image/jpeg",
      0.92,
    );
  });

  // Create a File from the blob
  return new File([blob], "cropped-image.jpg", { type: "image/jpeg" });
}

/**
 * Creates an HTMLImageElement from a URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

/**
 * Calculate the bounding box size after rotation
 */
function getRotatedBoundingBox(
  width: number,
  height: number,
  rotation: number,
): { width: number; height: number } {
  const rotRad = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rotRad));
  const sin = Math.abs(Math.sin(rotRad));

  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos,
  };
}
