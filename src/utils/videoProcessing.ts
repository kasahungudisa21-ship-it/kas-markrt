export const MAX_VIDEO_RECORDING_SEC = 30;
export const VIDEO_CHUNK_SIZE = 200000;
export const MAX_VIDEO_CHUNKS = 15;
export const MAX_VIDEO_BASE64_CHARS = VIDEO_CHUNK_SIZE * MAX_VIDEO_CHUNKS; // 3,000,000 chars (~2.2 MB binary)

export function formatVideoDuration(sec: number): string {
  const safe = Math.max(0, Math.round(sec));
  const mins = Math.floor(safe / 60);
  const rem = safe % 60;
  return `${mins}:${rem.toString().padStart(2, '0')}`;
}

export function getPreferredVideoMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return undefined;
  }
  const candidates = [
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm',
    'video/mp4',
  ];
  return candidates.find((mime) => MediaRecorder.isTypeSupported(mime));
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read video stream.'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read video stream.'));
    reader.readAsDataURL(blob);
  });
}

export function parseDataUrl(dataUrl: string): { mimeType: string; base64Body: string } {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) {
    return { mimeType: 'video/webm', base64Body: dataUrl.trim() };
  }
  const header = dataUrl.slice(0, commaIdx);
  const body = dataUrl.slice(commaIdx + 1).trim();
  const mimeMatch = header.match(/^data:([^;]+)/i);
  const mimeType = (mimeMatch?.[1] || 'video/webm').trim().slice(0, 80);
  return { mimeType, base64Body: body };
}

export function splitBase64IntoChunks(base64Body: string): string[] {
  const clean = base64Body.trim();
  if (!clean) return [];
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += VIDEO_CHUNK_SIZE) {
    chunks.push(clean.slice(i, i + VIDEO_CHUNK_SIZE));
  }
  return chunks;
}

export function assembleChunksToBlobUrl(chunks: string[], mimeType = 'video/webm'): string {
  const combinedBase64 = chunks.join('');
  const binaryStr = atob(combinedBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i += 1) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType || 'video/webm' });
  return URL.createObjectURL(blob);
}

export function getVideoDuration(srcUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const finish = (dur: number) => {
      video.removeAttribute('src');
      video.load();
      resolve(dur);
    };
    video.onloadedmetadata = () => {
      const dur = Number.isFinite(video.duration) && video.duration > 0 ? Math.round(video.duration) : 1;
      finish(Math.min(120, Math.max(1, dur)));
    };
    video.onerror = () => finish(1);
    video.src = srcUrl;
  });
}

async function compressVideoFile(file: File): Promise<{ dataUrl: string; mimeType: string; durationSec: number }> {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('VIDEO_INVALID'));
      video.src = objectUrl;
    });

    const srcWidth = video.videoWidth || 640;
    const srcHeight = video.videoHeight || 480;
    const scale = Math.min(1, 640 / Math.max(srcWidth, srcHeight));
    const width = Math.max(240, Math.round((srcWidth * scale) / 2) * 2);
    const height = Math.max(180, Math.round((srcHeight * scale) / 2) * 2);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx || typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
      throw new Error('VIDEO_TOO_LARGE');
    }

    const canvasStream = canvas.captureStream(20);
    // Attach audio track from video if browser supports captureStream on HTMLMediaElement
    const mediaEl = video as HTMLVideoElement & {
      captureStream?: () => MediaStream;
      mozCaptureStream?: () => MediaStream;
    };
    try {
      const elStream = mediaEl.captureStream?.() || mediaEl.mozCaptureStream?.();
      if (elStream) {
        elStream.getAudioTracks().forEach((t) => canvasStream.addTrack(t));
      }
    } catch {
      // Proceed with video-only compressed stream if audio capture blocked
    }

    const mimeType = getPreferredVideoMimeType() || 'video/webm';
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: 340000,
        audioBitsPerSecond: 24000,
      });
    } catch {
      recorder = new MediaRecorder(canvasStream);
    }

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };

    const recordedBlob = await new Promise<Blob>((resolve, reject) => {
      let rafId = 0;
      let stopped = false;

      const stopNow = () => {
        if (stopped) return;
        stopped = true;
        if (rafId) cancelAnimationFrame(rafId);
        video.pause();
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      };

      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: recorder.mimeType || mimeType }));
      };
      recorder.onerror = () => reject(new Error('VIDEO_INVALID'));

      const maxMs = MAX_VIDEO_RECORDING_SEC * 1000;
      const startedAt = Date.now();

      const drawFrame = () => {
        if (stopped) return;
        if (video.ended || Date.now() - startedAt >= maxMs) {
          stopNow();
          return;
        }
        ctx.drawImage(video, 0, 0, width, height);
        rafId = requestAnimationFrame(drawFrame);
      };

      video.onended = stopNow;
      recorder.start(250);
      video.play().then(drawFrame).catch(() => {
        stopNow();
        reject(new Error('VIDEO_INVALID'));
      });
    });

    const dataUrl = await blobToDataUrl(recordedBlob);
    const { mimeType: cleanMime, base64Body } = parseDataUrl(dataUrl);
    if (base64Body.length > MAX_VIDEO_BASE64_CHARS || base64Body.length === 0) {
      throw new Error('VIDEO_TOO_LARGE');
    }

    const durationSec = Number.isFinite(video.duration) && video.duration > 0
      ? Math.min(MAX_VIDEO_RECORDING_SEC, Math.max(1, Math.round(video.duration)))
      : 1;

    return { dataUrl, mimeType: cleanMime, durationSec };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function processUploadedVideoFile(
  file: File
): Promise<{ dataUrl: string; mimeType: string; durationSec: number }> {
  const isVideo =
    file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|3gp|mkv)$/i.test(file.name);
  if (!isVideo) {
    throw new Error('VIDEO_INVALID');
  }

  // Fast path: if file fits easily within our chunk budget (<= ~2.1 MB binary -> ~2.8 MB base64)
  if (file.size <= 2_150_000) {
    const dataUrl = await blobToDataUrl(file);
    const { mimeType, base64Body } = parseDataUrl(dataUrl);
    if (base64Body.length <= MAX_VIDEO_BASE64_CHARS) {
      const objUrl = URL.createObjectURL(file);
      try {
        const durationSec = await getVideoDuration(objUrl);
        return { dataUrl, mimeType: mimeType || file.type || 'video/mp4', durationSec };
      } finally {
        URL.revokeObjectURL(objUrl);
      }
    }
  }

  // Re-encode & scale down oversized videos client-side
  return compressVideoFile(file);
}
