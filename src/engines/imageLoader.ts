import type { LoadedImage } from '../types';

export const MAX_INPUT_BYTES = 50 * 1024 * 1024;
export const ACCEPTED_INPUT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export class ImageLoadError extends Error {
  code: 'unsupported' | 'too-large' | 'invalid' | 'decode' | 'empty';
  constructor(code: ImageLoadError['code'], message: string) {
    super(message);
    this.name = 'ImageLoadError';
    this.code = code;
  }
}

/** Read the real container type from magic bytes, never trusting the extension. */
export async function sniffImageType(file: File): Promise<string | null> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    head.length >= 8 &&
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    head.length >= 12 &&
    String.fromCharCode(...head.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...head.slice(8, 12)) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

export async function loadImageFile(file: File): Promise<LoadedImage> {
  if (!file || file.size === 0) {
    throw new ImageLoadError('empty', 'That file is empty. Choose a photograph or signature image.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageLoadError(
      'too-large',
      `This file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The maximum input is 50 MB.`,
    );
  }

  const sniffed = await sniffImageType(file);
  if (!sniffed) {
    throw new ImageLoadError(
      'unsupported',
      'That file is not a JPEG, PNG or WebP image. Convert it to one of those formats and try again.',
    );
  }
  if (!ACCEPTED_INPUT_TYPES.includes(sniffed)) {
    throw new ImageLoadError('unsupported', 'Only JPEG, PNG and WebP images are supported.');
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await decodeImage(url);
    return {
      name: file.name || `pasted-image.${sniffed.split('/')[1]}`,
      type: sniffed,
      sizeBytes: file.size,
      width: image.naturalWidth,
      height: image.naturalHeight,
      url,
      image,
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new ImageLoadError(
      'decode',
      'The image could not be decoded. It may be damaged or use an unsupported variant.',
    );
  }
}

export function decodeImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) {
        reject(new Error('Zero-sized image'));
        return;
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error('Image decode failed'));
    img.src = url;
  });
}

export function releaseImage(image: LoadedImage | null) {
  if (image?.url) URL.revokeObjectURL(image.url);
}

/** Convert an in-memory canvas into a File-like blob and verify it decodes. */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('The browser could not encode this image.'));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

export async function blobDecodes(blob: Blob): Promise<{ ok: boolean; width: number; height: number }> {
  try {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(blob);
      const result = { ok: true, width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return result;
    }
  } catch {
    /* fall through to <img> decode */
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = await decodeImage(url);
    return { ok: true, width: img.naturalWidth, height: img.naturalHeight };
  } catch {
    return { ok: false, width: 0, height: 0 };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function supportsFormat(type: string): Promise<boolean> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const blob = await canvasToBlob(canvas, type, 0.8);
    return blob.type === type;
  } catch {
    return false;
  }
}
