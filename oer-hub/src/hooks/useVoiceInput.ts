import { useCallback, useEffect, useRef } from "react";
import { useReviewStore } from "../store/reviewStore";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognitionCtor: (new () => SpeechRecognition) | null =
  typeof window !== "undefined"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null)
    : null;

export const isSpeechSupported = SpeechRecognitionCtor !== null;

interface UseVoiceInputOptions {
  fieldId: string;
  value: string;
  onChange: (value: string) => void;
  onError?: (msg: string) => void;
}

export function useVoiceInput({ fieldId, value, onChange, onError }: UseVoiceInputOptions) {
  const activeVoiceFieldId = useReviewStore((s) => s.activeVoiceFieldId);
  const setActiveVoiceField = useReviewStore((s) => s.setActiveVoiceField);

  const isRecording = activeVoiceFieldId === fieldId;

  // Stable refs so event handlers never capture stale callbacks
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseTextRef = useRef("");      // field value before this session (for discard)
  const sessionFinalRef = useRef(""); // accumulated final transcripts this session

  // Returns the committed text (base + all finalized transcripts so far)
  const getCommitted = useCallback((): string => {
    const base = baseTextRef.current;
    const final = sessionFinalRef.current;
    if (!final) return base;
    const sep = base.length > 0 && !base.endsWith(" ") ? " " : "";
    return base + sep + final;
  }, []);

  const stopInternal = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try { rec.stop(); } catch { /* already stopped */ }
      recognitionRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!SpeechRecognitionCtor) return;

    baseTextRef.current = value;
    sessionFinalRef.current = "";

    const rec = new SpeechRecognitionCtor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let newFinal = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) newFinal += t;
        else interim += t;
      }
      sessionFinalRef.current += newFinal;

      const committed = getCommitted();
      const sep = committed.length > 0 && !committed.endsWith(" ") && interim ? " " : "";
      onChangeRef.current(committed + (interim ? sep + interim : ""));
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      const msg =
        event.error === "not-allowed"
          ? "Microphone access denied"
          : "Recording stopped unexpectedly";
      onErrorRef.current?.(msg);
      onChangeRef.current(getCommitted());
      stopInternal();
      setActiveVoiceField(null);
    };

    rec.onend = () => {
      onChangeRef.current(getCommitted());
      recognitionRef.current = null;
      setActiveVoiceField(null);
    };

    recognitionRef.current = rec;
    rec.start();
    setActiveVoiceField(fieldId);
  }, [fieldId, value, getCommitted, stopInternal, setActiveVoiceField]);

  const stopRecording = useCallback(() => {
    onChangeRef.current(getCommitted());
    stopInternal();
    setActiveVoiceField(null);
  }, [getCommitted, stopInternal, setActiveVoiceField]);

  const discard = useCallback(() => {
    onChangeRef.current(baseTextRef.current);
    stopInternal();
    setActiveVoiceField(null);
  }, [stopInternal, setActiveVoiceField]);

  // Another field started recording — commit and stop this one
  useEffect(() => {
    if (!isRecording && recognitionRef.current) {
      onChangeRef.current(getCommitted());
      stopInternal();
    }
  }, [isRecording, getCommitted, stopInternal]);

  // Cleanup on unmount
  useEffect(() => () => { stopInternal(); }, [stopInternal]);

  return { isSupported: isSpeechSupported, isRecording, startRecording, stopRecording, discard };
}
