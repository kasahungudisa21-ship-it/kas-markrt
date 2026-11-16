import { Language, ListingCategory } from '../types';

const ANGLE_PROMPTS_EN: Record<ListingCategory, string[]> = {
  apartment: [
    'Front / Building Exterior',
    'Living Room',
    'Kitchen',
    'Master Bedroom',
    'Bathroom',
    'Balcony / View',
  ],
  house: [
    'Front Facade & Gate',
    'Living & Dining Room',
    'Kitchen',
    'Bedrooms',
    'Bathroom',
    'Compound / Yard',
  ],
  land: [
    'Street Frontage',
    'Full Plot Overview',
    'Left Boundary',
    'Right Boundary',
    'Road Access & Neighborhood',
    'Corner Marker / Survey',
  ],
  vehicle: [
    'Front 3/4 Angle',
    'Rear Angle',
    'Left Side Profile',
    'Right Side Profile',
    'Interior & Dashboard',
    'Engine / Trunk / Tires',
  ],
  goods: [
    'Front View',
    'Back View',
    'Left Side',
    'Right Side',
    'Top / Close-up Detail',
    'Brand Label / Accessories',
  ],
};

const ANGLE_PROMPTS_AM: Record<ListingCategory, string[]> = {
  apartment: [
    'የፊት / ውጫዊ እይታ',
    'ሳሎን',
    'ወጥ ቤት',
    'ዋና መኝታ ክፍል',
    'መታጠቢያ ቤት',
    'በረንዳ / እይታ',
  ],
  house: [
    'የፊት ገጽታ እና በር',
    'ሳሎን እና መመገቢያ',
    'ወጥ ቤት',
    'መኝታ ክፍሎች',
    'መታጠቢያ ቤት',
    'ግቢ / አካባቢ',
  ],
  land: [
    'የመንገድ ፊት ለፊት',
    'ሙሉ የቦታው እይታ',
    'የግራ ድንበር',
    'የቀኝ ድንበር',
    'መንገድ እና አካባቢ',
    'ካርታ / የድንበር ምልክት',
  ],
  vehicle: [
    'የፊት ጎን እይታ',
    'የኋላ እይታ',
    'የግራ ጎን',
    'የቀኝ ጎን',
    'የውስጥ / ዳሽቦርድ',
    'ሞተር / ዕቃ መጫኛ / ጎማ',
  ],
  goods: [
    'የፊት እይታ',
    'የኋላ እይታ',
    'የግራ ጎን',
    'የቀኝ ጎን',
    'ከላይ / ቅርብ እይታ',
    'ምልክት / ተጨማሪ ዕቃዎች',
  ],
};

export function getAnglePrompts(category: ListingCategory, lang: Language): string[] {
  return lang === 'am' ? ANGLE_PROMPTS_AM[category] : ANGLE_PROMPTS_EN[category];
}

function encodeCanvasWithinBudget(
  sourceCanvas: HTMLCanvasElement,
  maxChars: number
): string {
  const attempts: { scale: number; quality: number }[] = [
    { scale: 1, quality: 0.78 },
    { scale: 1, quality: 0.64 },
    { scale: 0.8, quality: 0.62 },
    { scale: 0.65, quality: 0.56 },
    { scale: 0.5, quality: 0.5 },
    { scale: 0.38, quality: 0.46 },
    { scale: 0.28, quality: 0.42 },
    { scale: 0.2, quality: 0.38 },
  ];

  let lastResult = sourceCanvas.toDataURL('image/jpeg', 0.5);
  for (const attempt of attempts) {
    const targetW = Math.max(120, Math.round(sourceCanvas.width * attempt.scale));
    const targetH = Math.max(90, Math.round(sourceCanvas.height * attempt.scale));
    const workCanvas = document.createElement('canvas');
    workCanvas.width = targetW;
    workCanvas.height = targetH;
    const ctx = workCanvas.getContext('2d');
    if (!ctx) continue;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(sourceCanvas, 0, 0, targetW, targetH);
    const dataUrl = workCanvas.toDataURL('image/jpeg', attempt.quality);
    lastResult = dataUrl;
    if (dataUrl.length <= maxChars) {
      return dataUrl;
    }
  }
  return lastResult;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Failed to decode image file.'));
    el.src = src;
  });
}

function readBlobAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Unable to read image file.'));
      }
    };
    reader.onerror = () => reject(new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });
}

export async function compressImageFile(
  file: File | Blob,
  maxChars = 135000
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    try {
      img = await loadImageElement(objectUrl);
    } catch {
      const rawDataUrl = await readBlobAsDataUrl(file);
      img = await loadImageElement(rawDataUrl);
    }

    const maxDim = 760;
    const ratio = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
    const width = Math.max(1, Math.round((img.naturalWidth || maxDim) * ratio));
    const height = Math.max(1, Math.round((img.naturalHeight || maxDim) * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable.');
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return encodeCanvasWithinBudget(canvas, maxChars);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function captureVideoFrameAsDataUrl(
  video: HTMLVideoElement,
  maxChars = 135000
): string {
  const vw = video.videoWidth || 640;
  const vh = video.videoHeight || 480;
  const maxDim = 760;
  const ratio = Math.min(1, maxDim / Math.max(vw, vh));
  const width = Math.max(1, Math.round(vw * ratio));
  const height = Math.max(1, Math.round(vh * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable.');
  }
  ctx.drawImage(video, 0, 0, width, height);
  return encodeCanvasWithinBudget(canvas, maxChars);
}
