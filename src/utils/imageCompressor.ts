/**
 * High-Fidelity Client-Side Image Compressor
 * Resizes large images to optimal crisp dimensions and compresses to WebP/JPEG
 * without perceptible quality loss, ensuring blazing fast Firestore sync and page speed.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.88)
  format?: 'image/webp' | 'image/jpeg';
}

export const compressImageFile = (
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.88,
      format = 'image/webp',
    } = options;

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
        let { width, height } = img;

        // Maintain exact aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // High quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // White background for transparent PNG converted to JPEG/WebP
        ctx.fillStyle = '#141414';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        try {
          // Check webp support
          const compressedDataUrl = canvas.toDataURL(format, quality);
          if (compressedDataUrl.startsWith(`data:${format}`)) {
            resolve(compressedDataUrl);
          } else {
            // Fallback to JPEG
            resolve(canvas.toDataURL('image/jpeg', quality));
          }
        } catch {
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        }
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
};
