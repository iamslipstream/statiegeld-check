/**
 * Downscale and re-encode an image to a compact JPEG data URL so it fits well
 * within the storage request limit. Runs in the browser (uses canvas). Returns
 * a data URL string. Shared by the marketplace and lost-and-found forms.
 */
export async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 1100;
  let { width, height } = bitmap;
  if (Math.max(width, height) > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.72;
  let url = canvas.toDataURL("image/jpeg", quality);
  // Shrink quality until the encoded size is comfortably under ~800 KB.
  while (url.length > 800 * 1024 && quality > 0.4) {
    quality -= 0.1;
    url = canvas.toDataURL("image/jpeg", quality);
  }
  return url;
}
