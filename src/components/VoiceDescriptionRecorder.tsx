import { useEffect, useRef, useState } from 'react';
import { Mic, RotateCcw, Square, Trash2, Upload, Volume2 } from 'lucide-react';
import { translations } from '../i18n';
import { Language } from '../types';

interface VoiceDescriptionRecorderProps {
  lang: Language;
  voiceUrl: string;
  durationSec: number;
  onChange: (voiceUrl: string, durationSec: number) => void;
}

const MAX_RECORDING_SEC = 45;
const MAX_VOICE_DATA_URL_LENGTH = 220000;

function formatDuration(sec: number): string {
  const safe = Math.max(0, Math.round(sec));
  const mins = Math.floor(safe / 60);
  const rem = safe % 60;
  return `${mins}:${rem.toString().padStart(2, '0')}`;
}

function getPreferredAudioMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return undefined;
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  return candidates.find((mime) => MediaRecorder.isTypeSupported(mime));
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read audio stream.'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read audio stream.'));
    reader.readAsDataURL(blob);
  });
}

export function VoiceDescriptionRecorder({
  lang,
  voiceUrl,
  durationSec,
  onChange,
}: VoiceDescriptionRecorderProps) {
  const t = translations[lang];
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cleanupStream = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  };

  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, []);

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    setIsRecording(false);
  };

  const startRecording = async () => {
    setErrorMsg('');
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setErrorMsg(t.voiceMicError);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = getPreferredAudioMimeType();
      const options: MediaRecorderOptions = mimeType
        ? { mimeType, audioBitsPerSecond: 24000 }
        : { audioBitsPerSecond: 24000 };

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch {
        recorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        const finalSec = Math.max(
          1,
          Math.min(MAX_RECORDING_SEC, Math.round((Date.now() - startTimeRef.current) / 1000))
        );
        const blobType = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        cleanupStream();

        if (blob.size === 0) return;

        try {
          const dataUrl = await blobToDataUrl(blob);
          if (dataUrl.length > MAX_VOICE_DATA_URL_LENGTH) {
            setErrorMsg(t.voiceTooLargeError);
            return;
          }
          onChange(dataUrl, finalSec);
        } catch {
          setErrorMsg(t.voiceMicError);
        }
      };

      startTimeRef.current = Date.now();
      setElapsedSec(0);
      setIsRecording(true);
      recorder.start(250);

      timerRef.current = window.setInterval(() => {
        const nextSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSec(nextSec);
        if (nextSec >= MAX_RECORDING_SEC) {
          stopRecording();
        }
      }, 250);
    } catch {
      cleanupStream();
      setIsRecording(false);
      setErrorMsg(t.voiceMicError);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorMsg('');

    try {
      const dataUrl = await blobToDataUrl(file);
      if (dataUrl.length > MAX_VOICE_DATA_URL_LENGTH) {
        setErrorMsg(t.voiceTooLargeError);
        return;
      }

      const audio = new Audio(dataUrl);
      audio.onloadedmetadata = () => {
        const secs = Number.isFinite(audio.duration)
          ? Math.max(1, Math.min(120, Math.round(audio.duration)))
          : 1;
        onChange(dataUrl, secs);
      };
      audio.onerror = () => {
        onChange(dataUrl, 1);
      };
    } catch {
      setErrorMsg(t.voiceMicError);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
            <Volume2 className="w-4 h-4 text-emerald-800 shrink-0" />
            <span>{t.voiceDescLabel}</span>
          </div>
          <p className="text-[11px] text-zinc-500">{t.voiceDescSub}</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {!isRecording && !voiceUrl && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={startRecording}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium transition-colors whitespace-nowrap"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{t.voiceRecordStart}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-medium transition-colors whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t.voiceUploadAudio}</span>
            </button>
          </div>
        )}
      </div>

      {isRecording && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shrink-0" />
            <span className="text-xs font-semibold text-red-900">{t.voiceRecordingActive}</span>
            <span className="font-mono text-xs font-semibold text-red-800 tabular-nums">
              {formatDuration(elapsedSec)} / {formatDuration(MAX_RECORDING_SEC)}
            </span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-medium transition-colors whitespace-nowrap"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>{t.voiceRecordStop}</span>
          </button>
        </div>
      )}

      {!isRecording && voiceUrl && (
        <div className="p-3 rounded-lg bg-white border border-emerald-200 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-emerald-900 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t.voicePlayHeading}</span>
            </span>
            {durationSec > 0 && (
              <span className="font-mono text-zinc-600 tabular-nums">
                {formatDuration(durationSec)}
              </span>
            )}
          </div>

          <audio controls src={voiceUrl} className="w-full h-9" />

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={startRecording}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.voiceRerecord}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t.voiceUploadAudio}</span>
            </button>
            <button
              type="button"
              onClick={() => onChange('', 0)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-medium text-red-700"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.voiceRemove}</span>
            </button>
          </div>
        </div>
      )}

      {errorMsg && <p className="text-xs text-red-700">{errorMsg}</p>}
    </div>
  );
}
