import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

export default function VoiceInputButton({ 
  currentText = '', 
  onTextChange, 
  accentColor = 'blue',
  lang = 'en-IN'
}) {
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const baseTextRef = useRef('');
  const silenceTimerRef = useRef(null);
  const isIntentionalStopRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const supported = !!SpeechRecognition;
    setIsSupported(supported);
    console.log("[VOICE] supported:", supported);
  }, []);

  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      console.log("[VOICE] stopping after silence");
      isIntentionalStopRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Stop error:', e);
        }
      }
      setIsListening(false);
    }, 3000);
  };

  const startListening = () => {
    setErrorMsg(null);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMsg('Voice input is not supported in this browser.');
      console.log("[VOICE] supported: false");
      return;
    }

    if (recognitionRef.current) {
      try {
        isIntentionalStopRef.current = true;
        recognitionRef.current.abort();
      } catch (e) {}
    }

    try {
      isIntentionalStopRef.current = false;
      baseTextRef.current = currentText || '';

      console.log("[VOICE] start");
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang || (navigator.language || 'en-IN');

      recognition.onstart = () => {
        setIsListening(true);
        console.log("[VOICE] recognition started");
        resetSilenceTimer();
      };

      recognition.onresult = (event) => {
        resetSilenceTimer();

        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            finalTranscript += text + ' ';
          } else {
            interimTranscript += text;
          }
        }

        const speechText = (finalTranscript + interimTranscript).trim();
        if (speechText) {
          const base = baseTextRef.current.trim();
          const combined = base ? `${base} ${speechText}` : speechText;
          if (onTextChange) {
            onTextChange(combined);
          }
        }
      };

      recognition.onerror = (event) => {
        console.log("[VOICE] error:", event.error);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        let msg = '';
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          msg = 'Microphone access denied.';
        } else if (event.error === 'network') {
          msg = 'Speech recognition service unavailable.';
        } else if (event.error === 'no-speech') {
          msg = 'No speech detected.';
        } else if (event.error === 'audio-capture') {
          msg = 'No microphone hardware found.';
        } else if (event.error === 'service-not-allowed') {
          msg = 'Speech recognition service not allowed.';
        } else if (event.error === 'aborted') {
          msg = '';
        } else {
          msg = 'Speech recognition error.';
        }

        if (msg && event.error !== 'no-speech' && event.error !== 'aborted') {
          setErrorMsg(msg);
        }

        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        console.log("[VOICE] end");
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setErrorMsg('Could not access microphone.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    isIntentionalStopRef.current = true;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error(err);
      }
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      isIntentionalStopRef.current = true;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (err) {}
      }
    };
  }, []);

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-1 text-[11px] text-[#7A8896]" title="Voice input is not supported in this browser">
        <MicOff className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Voice Unsupported</span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-2 font-sans">
      <button
        type="button"
        onClick={handleClick}
        title={isListening ? 'Stop voice input' : 'Start voice input (Speak)'}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        className={`px-3 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 select-none cursor-pointer ${
          isListening
            ? 'bg-[#FEF2F2] text-[#B42318] border-[#B42318] shadow-2xs'
            : 'bg-[#F5F7FA] text-[#1565C0] border-[#D9E2EC] hover:bg-[#EEF3F8]'
        }`}
      >
        {isListening ? (
          <>
            <span className="w-2 h-2 rounded-full bg-[#B42318] animate-ping" />
            <span className="font-mono text-[11px] font-bold text-[#B42318]">Listening...</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-[#1565C0]" />
            <span className="text-[11px] font-bold">Speak</span>
          </>
        )}
      </button>

      {errorMsg && (
        <div className="text-[10px] text-[#B42318] font-mono flex items-center gap-1 bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#F87171]">
          <AlertCircle className="w-3 h-3 text-[#B42318] shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
