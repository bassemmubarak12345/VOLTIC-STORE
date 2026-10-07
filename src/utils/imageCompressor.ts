/**
 * High-Fidelity Client-Side Image Compressor
 * Resizes images to crisp optimal dimensions and compresses to WebP/JPEG
 * ensuring instant Firestore cloud synchronization and blistering fast load times.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.85)
  format?: 'image/webp' | 'image/jpeg';
}

export const compressImageFile = (
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 800,
      maxHeight = 800,
      quality = 0.85,
      format = 'image/webp',
    } = options;

    if (!file) {
      reject(new Error('No file provided for compression'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        reject(new Error('Empty image result'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        // If image object fails to decode, resolve raw data URL as fallback
        resolve(result);
      };
      img.onload = () => {
        try {
          let { width, height } = img;

          // Maintain aspect ratio while scaling within max bounds
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          // Ensure minimum dimensions
          width = Math.max(1, width);
          height = Math.max(1, height);

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d', { alpha: true });
          if (!ctx) {
            resolve(result);
            return;
          }

          // High quality rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          try {
            // Check WebP support
            const compressedDataUrl = canvas.toDataURL(format, quality);
            if (compressedDataUrl && compressedDataUrl.startsWith(`data:${format}`)) {
              resolve(compressedDataUrl);
            } else {
              // Fallback to high quality JPEG
              resolve(canvas.toDataURL('image/jpeg', quality));
            }
          } catch {
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          }
        } catch {
          resolve(result);
        }
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  });
};
