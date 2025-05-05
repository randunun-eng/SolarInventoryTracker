import { useState, useEffect, useCallback } from 'react';

// Type for speech recognition instance
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onerror: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: (event: Event) => void;
}

// Type for speech recognition constructor
interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// Type for speech recognition event
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

// Type for speech recognition result list
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

// Type for speech recognition result
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

// Type for speech recognition alternative
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

// Type for speech synthesis voice
interface SpeechSynthesisVoice {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

// Hook to handle voice features (speech recognition and synthesis)
export function useVoiceFeatures() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [synthesisSupported, setSynthesisSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Initialize Speech Recognition
  const SpeechRecognition = (
    window.SpeechRecognition || 
    (window as any).webkitSpeechRecognition
  ) as SpeechRecognitionConstructor | undefined;

  // Initialize Speech Recognition instance
  const recognition = SpeechRecognition 
    ? new SpeechRecognition() 
    : undefined;

  // Check for browser support on component mount
  useEffect(() => {
    setRecognitionSupported(!!SpeechRecognition);
    setSynthesisSupported(!!window.speechSynthesis);

    // Initialize speech synthesis voices
    if (window.speechSynthesis) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
          setVoices(availableVoices);
          // Set default to an English voice if available
          const defaultVoice = availableVoices.find(voice => 
            voice.lang.includes('en-') && voice.localService
          ) || availableVoices[0];
          setSelectedVoice(defaultVoice);
        }
      };

      loadVoices();
      // Chrome loads voices asynchronously
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Configure recognition settings
  // Add state for speech detection
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastSpeechTime, setLastSpeechTime] = useState<number>(0);
  const [autoSubmitCallback, setAutoSubmitCallback] = useState<(() => void) | null>(null);
  
  // Function to clear silence timer
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      setSilenceTimer(null);
    }
  }, [silenceTimer]);
  
  // Define stop function outside useEffect
  const internalStopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  useEffect(() => {
    if (!recognition) return;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const transcript = result[0].transcript;
      setTranscript(transcript);
      
      // Update the last time speech was detected
      setLastSpeechTime(Date.now());
      
      // Clear any existing silence timer
      clearSilenceTimer();
      
      // Set a new silence timer if we have a callback
      if (autoSubmitCallback) {
        const timer = setTimeout(() => {
          // If we have a transcript and 1.5 seconds has passed, auto-submit
          if (transcript.trim() && autoSubmitCallback) {
            internalStopListening();
            autoSubmitCallback();
          }
        }, 1500); // 1.5 seconds of silence triggers submission
        
        setSilenceTimer(timer);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      
      // Clear silence timer if it exists
      clearSilenceTimer();
      
      // Check if we should auto-submit on end
      if (transcript.trim() && autoSubmitCallback && Date.now() - lastSpeechTime < 2000) {
        autoSubmitCallback();
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event);
      setIsListening(false);
      
      // Clear silence timer if it exists
      clearSilenceTimer();
    };
  }, [recognition, clearSilenceTimer, transcript, autoSubmitCallback, lastSpeechTime]);

  // Start listening
  const startListening = useCallback((submitCallback?: () => void) => {
    if (!recognition) return;
    
    setTranscript('');
    recognition.start();
    setIsListening(true);
    
    // Set the callback if provided
    if (submitCallback) {
      setAutoSubmitCallback(() => submitCallback);
    }
  }, [recognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognition) return;
    
    recognition.stop();
    setIsListening(false);
    
    // Clear the auto-submit callback
    setAutoSubmitCallback(null);
    
    // Clear any existing silence timer
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      setSilenceTimer(null);
    }
  }, [recognition, silenceTimer]);

  // Speak text
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    window.speechSynthesis.speak(utterance);
  }, [selectedVoice]);

  // Change voice
  const changeVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
  }, []);

  return {
    isListening,
    transcript,
    recognitionSupported,
    synthesisSupported,
    voices,
    selectedVoice,
    startListening,
    stopListening,
    speak,
    changeVoice
  };
}