import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function VoiceTest() {
  const [text, setText] = useState('Hello, this is a test of the speech synthesis system.');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [synthesisSupported, setSynthesisSupported] = useState(false);
  
  // Initialize on mount
  useEffect(() => {
    // Check if speech synthesis is supported
    const isSupported = 'speechSynthesis' in window;
    setSynthesisSupported(isSupported);
    
    if (isSupported) {
      // Load available voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        console.log('Debug - Available voices:', availableVoices.map(v => v.name));
        
        if (availableVoices.length > 0) {
          setVoices(availableVoices);
          // Find an English voice
          const englishVoice = availableVoices.find(voice => 
            voice.lang.includes('en-')
          );
          setSelectedVoice(englishVoice || availableVoices[0]);
        }
      };
      
      // Load voices initially
      loadVoices();
      
      // Chrome loads voices asynchronously
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);
  
  const speakWithDefaultVoice = () => {
    if (!synthesisSupported) {
      console.error('Speech synthesis not supported');
      return;
    }
    
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      console.log('Speaking with default voice');
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error speaking with default voice:', error);
    }
  };
  
  const speakWithSelectedVoice = () => {
    if (!synthesisSupported || !selectedVoice) {
      console.error('Speech synthesis not supported or no voice selected');
      return;
    }
    
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Create utterance with selected voice
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice;
      
      console.log('Speaking with voice:', selectedVoice.name);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error speaking with selected voice:', error);
    }
  };
  
  const speakDirectly = () => {
    if (!window.speechSynthesis) return;
    
    // Method 3: Direct method without any setup
    const msg = new SpeechSynthesisUtterance();
    msg.text = text;
    msg.volume = 1; // 0 to 1
    msg.rate = 1; // 0.1 to 10
    msg.pitch = 1; // 0 to 2
    
    // Debug events
    msg.onstart = () => console.log('Direct speech started');
    msg.onend = () => console.log('Direct speech ended');
    msg.onerror = (e) => console.error('Direct speech error:', e);
    
    window.speechSynthesis.speak(msg);
  };

  const cancelSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      console.log('Speech cancelled');
    }
  };

  return (
    <div className="p-4 space-y-4 border rounded-lg">
      <h2 className="text-xl font-bold">Voice Synthesis Test</h2>
      
      {!synthesisSupported && (
        <div className="p-2 mb-4 text-white bg-red-500 rounded">
          Speech synthesis is not supported in this browser
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="speech-text" className="block text-sm font-medium">
          Text to speak:
        </label>
        <Input
          id="speech-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <div className="text-sm font-medium">Available voices: {voices.length}</div>
        {selectedVoice && (
          <div className="text-sm">
            Selected voice: {selectedVoice.name} ({selectedVoice.lang})
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button onClick={speakWithDefaultVoice} disabled={!synthesisSupported}>
          Method 1: Speak with Default Voice
        </Button>
        
        <Button 
          onClick={speakWithSelectedVoice} 
          disabled={!synthesisSupported || !selectedVoice}
        >
          Method 2: Speak with Selected Voice
        </Button>
        
        <Button onClick={speakDirectly} disabled={!synthesisSupported}>
          Method 3: Speak Directly
        </Button>
        
        <Button variant="destructive" onClick={cancelSpeech} disabled={!synthesisSupported}>
          Stop Speaking
        </Button>
      </div>
    </div>
  );
}