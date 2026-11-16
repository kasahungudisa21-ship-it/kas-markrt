import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Loader2,
  RefreshCw,
  RotateCcw,
  Square,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { translations } from '../i18n';
import { Language } from '../types';
import {
  blobToDataUrl,
  formatVideoDuration,
  getPreferredVideoMimeType,
  MAX_VIDEO_BASE64_CHARS,
  MAX_VIDEO_RECORDING_SEC,
  parseDataUrl,
  processUploadedVideoFile,
} from '../utils/videoProcessing';

interface ListingVideoRecorderProps {
  lang: Language;
  videoUrl: string;
  durationSec: number;
  onChange: (videoDataUrl: string, mimeType: string, durationSec: number) => void;
}

export function ListingVideoRecorder({
  lang,
  videoUrl,
  durationSec,
  onChange,
}: ListingVideoRecorderProps) {
  const t = translations[lang];

  const [modalOpen, setModalOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const deviceCaptureInputRef = useRef<HTMLInputElement | null>(null);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStream = () => {
    stopTimer();
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        // Ignore already inactive recorder
      }
    }
    recorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
    setIsRecording(false);
  };

  useEffect(() => {
    if (!modalOpen) {
      stopStream();
      setCameraUnavailable(false);
      return;
    }

    let cancelled = false;
    setCameraReady(false);
    setCameraUnavailable(false);

    async function initCamera() {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia ||
        typeof MediaRecorder === 'undefined'
      ) {
        if (!cancelled) setCameraUnavailable(true);
        return;
      }

      try {
        stopStream();
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: true,
          });
        } catch {
          // Retry video-only if microphone permission was denied
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          });
        }

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
          await previewVideoRef.current.play().catch(() => {});
          setCameraReady(true);
        }
      } catch {
        if (!cancelled) setCameraUnavailable(true);
      }
    }

    initCamera();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [modalOpen, facingMode]);

  const stopRecording = () => {
    stopTimer();
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    }
    setIsRecording(false);
  };

  const startRecording = () => {
    if (!streamRef.current || typeof MediaRecorder === 'undefined') {
      setCameraUnavailable(true);
      return;
    }

    setErrorMsg('');
    chunksRef.current = [];
    const mimeType = getPreferredVideoMimeType();

    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(streamRef.current, {
            mimeType,
            videoBitsPerSecond: 340000,
            audioBitsPerSecond: 24000,
          })
        : new MediaRecorder(streamRef.current, {
            videoBitsPerSecond: 340000,
            audioBitsPerSecond: 24000,
          });
    } catch {
      recorder = new MediaRecorder(streamRef.current);
    }

    recorderRef.current = recorder;

    recorder.ondataavailable = (ev: BlobEvent) => {
      if (ev.data && ev.data.size > 0) {
        chunksRef.current.push(ev.data);
      }
    };

    recorder.onstop = async () => {
      stopTimer();
      const recordedSec = Math.max(
        1,
        Math.min(MAX_VIDEO_RECORDING_SEC, Math.round((Date.now() - startTimeRef.current) / 1000))
      );
      const blobType = recorder.mimeType || mimeType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type: blobType });
      setIsRecording(false);

      if (blob.size === 0) return;

      setProcessing(true);
      try {
        const dataUrl = await blobToDataUrl(blob);
        const { mimeType: cleanMime, base64Body } = parseDataUrl(dataUrl);
        if (base64Body.length > MAX_VIDEO_BASE64_CHARS) {
          setErrorMsg(t.videoTooLargeError);
          setModalOpen(false);
          return;
        }
        onChange(dataUrl, cleanMime, recordedSec);
        setModalOpen(false);
      } catch {
        setErrorMsg(t.videoInvalidFileError);
        setModalOpen(false);
      } finally {
        setProcessing(false);
      }
    };

    startTimeRef.current = Date.now();
    setElapsedSec(0);
    setIsRecording(true);
    recorder.start(300);

    timerRef.current = window.setInterval(() => {
      const next = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSec(next);
      if (next >= MAX_VIDEO_RECORDING_SEC) {
        stopRecording();
      }
    }, 250);
  };

  const handleVideoFileSelect = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg('');
    setProcessing(true);
    try {
      const result = await processUploadedVideoFile(file);
      onChange(result.dataUrl, result.mimeType, result.durationSec);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'VIDEO_TOO_LARGE') {
        setErrorMsg(t.videoTooLargeError);
      } else {
        setErrorMsg(t.videoInvalidFileError);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-[#E5F0FC] border border-[#AECCEF] space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#142F66]">
            <Video className="w-4 h-4 text-[#1D4ED8] shrink-0" />
            <span>{t.videoSectionTitle}</span>
          </div>
          <p className="text-[11px] text-[#294A87]">{t.videoSectionSub}</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            handleVideoFileSelect(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <input
          ref={deviceCaptureInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            handleVideoFileSelect(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        {!videoUrl && !processing && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E40AF] hover:bg-[#1E3A8A] text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Video className="w-3.5 h-3.5" />
              <span>{t.videoRecordStart}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#9BBCE6] bg-[#FFFDF8] hover:bg-[#D7E7FA] text-[#142F66] text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t.videoUploadButton}</span>
            </button>
          </div>
        )}
      </div>

      {processing && (
        <div className="p-3 rounded-lg bg-white border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-800 shrink-0" />
          <span>{t.videoCompressingLabel}</span>
        </div>
      )}

      {!processing && videoUrl && (
        <div className="p-3 rounded-lg bg-white border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-emerald-900 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t.videoPlayHeading}</span>
            </span>
            {durationSec > 0 && (
              <span className="font-mono text-zinc-600 tabular-nums">
                {formatVideoDuration(durationSec)}
              </span>
            )}
          </div>

          <div className="rounded-lg overflow-hidden bg-black border border-zinc-200">
            <video
              controls
              playsInline
              preload="metadata"
              src={videoUrl}
              className="w-full max-h-64 object-contain mx-auto"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.videoRerecord}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t.videoUploadButton}</span>
            </button>
            <button
              type="button"
              onClick={() => onChange('', '', 0)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-medium text-red-700"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.videoRemove}</span>
            </button>
          </div>
        </div>
      )}

      {errorMsg && <p className="text-xs text-red-700">{errorMsg}</p>}

      {/* Live Video Recording Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t.videoRecordModalTitle}
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl text-white">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm font-semibold truncate">{t.videoRecordModalTitle}</span>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label={t.cancel}
                className="w-9 h-9 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative aspect-[4/3] w-full bg-black flex items-center justify-center">
              {cameraUnavailable ? (
                <div className="p-6 text-center space-y-4 max-w-sm">
                  <Video className="w-10 h-10 text-zinc-400 mx-auto" />
                  <p className="text-xs text-zinc-300 leading-relaxed">{t.videoCameraError}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModalOpen(false);
                        deviceCaptureInputRef.current?.click();
                      }}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium inline-flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{t.videoRecordDevice}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="px-4 py-2 rounded-lg border border-zinc-600 hover:bg-zinc-800 text-zinc-100 text-xs font-medium inline-flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t.videoUploadButton}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={previewVideoRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                  {isRecording && (
                    <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-red-600/95 text-white text-xs font-semibold flex items-center gap-2 shadow">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span>{t.videoRecordingActive}</span>
                      <span className="font-mono tabular-nums">
                        {formatVideoDuration(elapsedSec)} / {formatVideoDuration(MAX_VIDEO_RECORDING_SEC)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-4 flex items-center justify-between gap-3 bg-zinc-900 border-t border-zinc-800">
              <button
                type="button"
                disabled={isRecording}
                onClick={() =>
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                className="px-3.5 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 disabled:opacity-40 text-xs font-medium text-zinc-200 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.cameraSwitchButton}</span>
              </button>

              <div className="flex items-center gap-2">
                {!isRecording && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="px-3.5 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-xs font-medium text-zinc-200 whitespace-nowrap"
                  >
                    {t.videoUploadButton}
                  </button>
                )}

                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>{t.videoRecordStop}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!cameraReady}
                    onClick={startRecording}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Video className="w-4 h-4" />
                    <span>{t.videoRecordBegin}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
