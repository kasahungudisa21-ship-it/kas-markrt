import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Star, Trash2, Upload, X } from 'lucide-react';
import { translations } from '../i18n';
import { Language, ListingCategory, ListingPhoto } from '../types';
import {
  captureVideoFrameAsDataUrl,
  compressImageFile,
  getAnglePrompts,
} from '../utils/imageCompression';
import { ResilientImage } from './ResilientImage';

export type PhotoSlotsState = (ListingPhoto | null)[];

interface MultiAnglePhotoUploaderProps {
  lang: Language;
  category: ListingCategory;
  slots: PhotoSlotsState;
  onChangeSlots: (nextSlots: PhotoSlotsState) => void;
}

export function createEmptyPhotoSlots(): PhotoSlotsState {
  return [null, null, null, null, null, null];
}

export function slotsToPhotosArray(slots: PhotoSlotsState): ListingPhoto[] {
  const result: ListingPhoto[] = [];
  slots.forEach((slot, idx) => {
    if (slot && slot.imageDataUrl.trim()) {
      result.push({
        slotIndex: result.length,
        angleLabel: slot.angleLabel.trim() || `Angle ${idx + 1}`,
        imageDataUrl: slot.imageDataUrl.trim(),
      });
    }
  });
  return result.slice(0, 6);
}

export function MultiAnglePhotoUploader({
  lang,
  category,
  slots,
  onChangeSlots,
}: MultiAnglePhotoUploaderProps) {
  const t = translations[lang];
  const anglePrompts = getAnglePrompts(category, lang);

  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [cameraSlot, setCameraSlot] = useState<number | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const multiInputRef = useRef<HTMLInputElement | null>(null);
  const slotFileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const slotCaptureRefs = useRef<(HTMLInputElement | null)[]>([]);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  useEffect(() => {
    if (cameraSlot === null) {
      stopCameraStream();
      setCameraUnavailable(false);
      return;
    }

    let cancelled = false;
    setCameraReady(false);
    setCameraUnavailable(false);

    async function startStream() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (!cancelled) {
          setCameraUnavailable(true);
        }
        return;
      }

      try {
        stopCameraStream();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setCameraReady(true);
        }
      } catch {
        if (!cancelled) {
          setCameraUnavailable(true);
        }
      }
    }

    startStream();

    return () => {
      cancelled = true;
      stopCameraStream();
    };
  }, [cameraSlot, facingMode]);

  const filledCount = slots.filter(Boolean).length;

  const setSlotPhoto = (slotIdx: number, dataUrl: string, customLabel?: string) => {
    const next = [...slots];
    const existingLabel = next[slotIdx]?.angleLabel;
    next[slotIdx] = {
      slotIndex: slotIdx,
      angleLabel: (customLabel || existingLabel || anglePrompts[slotIdx] || `Angle ${slotIdx + 1}`).slice(0, 80),
      imageDataUrl: dataUrl,
    };
    onChangeSlots(next);
  };

  const handleSingleFile = async (slotIdx: number, file: File | undefined) => {
    if (!file) return;
    setUploadError('');
    setBusySlot(slotIdx);
    try {
      const compressed = await compressImageFile(file);
      setSlotPhoto(slotIdx, compressed);
    } catch {
      setUploadError(t.photoCompressError);
    } finally {
      setBusySlot(null);
    }
  };

  const handleBatchFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError('');
    const next = [...slots];
    const fileArray = Array.from(files).slice(0, 6);
    let cursor = 0;

    for (const file of fileArray) {
      while (cursor < 6 && next[cursor] !== null) {
        cursor += 1;
      }
      if (cursor >= 6) break;
      setBusySlot(cursor);
      try {
        const compressed = await compressImageFile(file);
        next[cursor] = {
          slotIndex: cursor,
          angleLabel: anglePrompts[cursor] || `Angle ${cursor + 1}`,
          imageDataUrl: compressed,
        };
        cursor += 1;
      } catch {
        setUploadError(t.photoCompressError);
      }
    }

    setBusySlot(null);
    onChangeSlots(next);
  };

  const handleSnapFromCamera = () => {
    if (cameraSlot === null || !videoRef.current) return;
    try {
      const dataUrl = captureVideoFrameAsDataUrl(videoRef.current);
      setSlotPhoto(cameraSlot, dataUrl);
      setCameraSlot(null);
      setUploadError('');
    } catch {
      setUploadError(t.photoCompressError);
    }
  };

  const handleRemoveSlot = (slotIdx: number) => {
    const next = [...slots];
    next[slotIdx] = null;
    onChangeSlots(next);
  };

  const handleSetCover = (slotIdx: number) => {
    if (slotIdx === 0 || !slots[slotIdx]) return;
    const next = [...slots];
    const picked = next[slotIdx];
    const currentCover = next[0];
    next[0] = picked ? { ...picked, slotIndex: 0 } : null;
    next[slotIdx] = currentCover ? { ...currentCover, slotIndex: slotIdx } : null;
    onChangeSlots(next);
  };

  const handleLabelChange = (slotIdx: number, label: string) => {
    const item = slots[slotIdx];
    if (!item) return;
    const next = [...slots];
    next[slotIdx] = { ...item, angleLabel: label.slice(0, 80) };
    onChangeSlots(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-900">{t.photosSectionTitle}</span>
            <span className="text-xs font-mono font-semibold text-emerald-800 tabular-nums">
              {filledCount} / 6
            </span>
            {filledCount === 0 && (
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                {lang === 'am' ? 'ቢያንስ 1 ፎቶ ግዴታ ነው' : 'At least 1 photo required'}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500">{t.photosSectionSub}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            ref={multiInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleBatchFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => multiInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/80 text-xs font-medium text-emerald-950 transition-colors whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-800" />
            <span>{t.uploadAllSixLabel}</span>
          </button>
        </div>
      </div>

      {/* Slim 6-step Progress Indicator */}
      <div className="w-full h-1.5 rounded-full bg-[#DFD7C8] overflow-hidden">
        <div
          className="h-full bg-[#0F5E48] transition-all duration-200"
          style={{ width: `${Math.round((filledCount / 6) * 100)}%` }}
        />
      </div>

      {uploadError && (
        <p className="text-xs text-amber-900 bg-amber-100 border border-amber-300 rounded-lg px-3 py-2">
          {uploadError}
        </p>
      )}

      {/* 6 Angle Slots Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {slots.map((slot, idx) => {
          const promptLabel = anglePrompts[idx] || `Angle ${idx + 1}`;
          const isBusy = busySlot === idx;
          const isCover = idx === 0 && Boolean(slot);

          return (
            <div
              key={idx}
              className={`rounded-xl border p-2.5 space-y-2 transition-colors ${
                slot ? 'border-[#0F5E48]/50 bg-[#E3F5EE]/70' : 'border-[#D4CBB9] bg-[#F4EFE4]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-semibold text-[#18382F] truncate">
                  0{idx + 1}. {slot ? slot.angleLabel : promptLabel}
                </span>
                {isCover && (
                  <span className="font-medium text-emerald-800 shrink-0 whitespace-nowrap">
                    {t.coverAngleLabel}
                  </span>
                )}
              </div>

              <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                {slot ? (
                  <>
                    <ResilientImage
                      src={slot.imageDataUrl}
                      alt={slot.angleLabel}
                      category={category}
                      className="w-full h-full object-cover"
                    />
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetCover(idx)}
                        title={t.setCoverLabel}
                        className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/75 hover:bg-black text-white text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Star className="w-3 h-3" />
                        <span>{t.setCoverLabel}</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center gap-2">
                    <Camera className="w-5 h-5 text-zinc-400" />
                    <span className="text-[11px] text-zinc-500 line-clamp-2">{promptLabel}</span>
                  </div>
                )}
              </div>

              {slot && (
                <input
                  type="text"
                  maxLength={80}
                  value={slot.angleLabel}
                  onChange={(e) => handleLabelChange(idx, e.target.value)}
                  aria-label={`Angle ${idx + 1} label`}
                  className="w-full h-7 px-2 rounded-md border border-zinc-200 bg-white text-[11px] text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-800"
                />
              )}

              {/* Hidden File Inputs for Native Camera & Device Picker */}
              <input
                ref={(el) => {
                  slotCaptureRefs.current[idx] = el;
                }}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  handleSingleFile(idx, e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <input
                ref={(el) => {
                  slotFileRefs.current[idx] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleSingleFile(idx, e.target.files?.[0]);
                  e.target.value = '';
                }}
              />

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    setUploadError('');
                    setCameraSlot(idx);
                  }}
                  className="flex-1 h-8 px-2 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-[11px] font-medium text-zinc-800 inline-flex items-center justify-center gap-1 transition-colors whitespace-nowrap"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                  <span>{slot ? t.retakePhotoLabel : t.takePhotoLabel}</span>
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => slotFileRefs.current[idx]?.click()}
                  className="flex-1 h-8 px-2 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-[11px] font-medium text-zinc-800 inline-flex items-center justify-center gap-1 transition-colors whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  <span>{t.uploadPhotoLabel}</span>
                </button>

                {slot && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(idx)}
                    aria-label={t.removePhotoLabel}
                    title={t.removePhotoLabel}
                    className="h-8 w-8 shrink-0 rounded-lg border border-zinc-200 bg-white hover:bg-red-50 hover:border-red-200 text-zinc-500 hover:text-red-700 inline-flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Camera Viewfinder Modal */}
      {cameraSlot !== null && (
        <div
          className="fixed inset-0 z-[60] bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t.cameraModalTitle}
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl text-white">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{t.cameraModalTitle}</div>
                <div className="text-xs text-zinc-400 truncate">
                  0{cameraSlot + 1}. {anglePrompts[cameraSlot] || `Angle ${cameraSlot + 1}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCameraSlot(null)}
                aria-label={t.cancel}
                className="w-9 h-9 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative aspect-[4/3] w-full bg-black flex items-center justify-center">
              {cameraUnavailable ? (
                <div className="p-6 text-center space-y-4 max-w-sm">
                  <Camera className="w-10 h-10 text-zinc-400 mx-auto" />
                  <p className="text-xs text-zinc-300 leading-relaxed">{t.cameraPermissionFallback}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const target = cameraSlot;
                        setCameraSlot(null);
                        slotCaptureRefs.current[target]?.click();
                      }}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium inline-flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{t.takePhotoLabel}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = cameraSlot;
                        setCameraSlot(null);
                        slotFileRefs.current[target]?.click();
                      }}
                      className="px-4 py-2 rounded-lg border border-zinc-600 hover:bg-zinc-800 text-zinc-100 text-xs font-medium inline-flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t.uploadPhotoLabel}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="p-4 flex items-center justify-between gap-3 bg-zinc-900 border-t border-zinc-800">
              <button
                type="button"
                onClick={() =>
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                className="px-3.5 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-xs font-medium text-zinc-200 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.cameraSwitchButton}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = cameraSlot;
                    setCameraSlot(null);
                    slotFileRefs.current[target]?.click();
                  }}
                  className="px-3.5 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-xs font-medium text-zinc-200 whitespace-nowrap"
                >
                  {t.uploadPhotoLabel}
                </button>
                <button
                  type="button"
                  disabled={!cameraReady}
                  onClick={handleSnapFromCamera}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t.cameraSnapButton}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
