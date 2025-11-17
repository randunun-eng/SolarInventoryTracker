import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, MessageSquare, X, Mic, VolumeX, Volume2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useVoiceFeatures } from './useVoiceFeatures';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: 'Hello! I\'m your AI assistant. How can I help you with your inventory and repair management today?',
      type: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [voiceMode, setVoiceMode] = useState(false); // Disable voice by default to prevent auto-play issues
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Initialize voice features
  const {
    isListening,
    transcript,
    recognitionSupported,
    synthesisSupported,
    startListening,
    stopListening,
    speak
  } = useVoiceFeatures();

  // Define handleSendMessage early with useCallback
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    
    // If we're listening, stop listening first
    if (isListening) {
      stopListening();
    }
    
    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 15),
      content: inputValue,
      type: 'user',
      timestamp: new Date(),
    };
    
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Use Cloudflare AI endpoint with D1 database access
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: userMessage.content,
          isVoiceMode: voiceMode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Math.random().toString(36).substring(2, 15),
          content: data.response,
          type: 'assistant',
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Math.random().toString(36).substring(2, 15),
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          type: 'assistant',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, isListening, sessionId, stopListening, voiceMode, toast]);

  // Initialize session ID
  useEffect(() => {
    if (!sessionId) {
      // Generate a simple random ID
      setSessionId(Math.random().toString(36).substring(2, 15));
    }
  }, [sessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track last speech timestamp for auto-submission
  const [lastSpeechTimestamp, setLastSpeechTimestamp] = useState<number>(0);
  const autoSubmitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to check for command keywords
  const checkForCommandKeywords = (text: string): boolean => {
    const submitKeywords = [
      "submit", 
      "send", 
      "go ahead", 
      "execute", 
      "process that", 
      "done speaking", 
      "that's all"
    ];
    
    const lowercaseText = text.toLowerCase();
    return submitKeywords.some(keyword => lowercaseText.includes(keyword));
  };
  
  // Auto-submit after a pause in speech
  const setupAutoSubmitTimeout = () => {
    // Clear any existing timeout
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
    }
    
    // Set new timeout - will submit if no new speech after 2.5 seconds
    autoSubmitTimeoutRef.current = setTimeout(() => {
      if (isListening && inputValue.trim().length > 10) {
        console.log('Auto-submitting after speech pause');
        stopListening();
        handleSendMessage();
      }
    }, 2500);
  };
  
  // Effect to handle speech transcript updates - update input value and check for auto-submit
  useEffect(() => {
    if (transcript && isListening) {
      console.log('Updating input value with transcript:', transcript);
      setInputValue(transcript);
      
      // Update speech timestamp
      setLastSpeechTimestamp(Date.now());
      
      // Check for command keywords that trigger immediate submission
      if (checkForCommandKeywords(transcript)) {
        console.log('Command keyword detected, auto-submitting message');
        stopListening();
        // Small delay to ensure final words are captured
        setTimeout(() => handleSendMessage(), 300);
        return;
      }
      
      // Set up auto-submit timeout
      setupAutoSubmitTimeout();
    }
  }, [transcript, isListening]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
      }
    };
  }, []);

  // Track already spoken messages
  const [spokenMessageIds, setSpokenMessageIds] = useState<Set<string>>(new Set<string>());

  // Effect to handle speaking of assistant responses
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    // Only speak if:
    // 1. Voice mode is on
    // 2. The message is from the assistant
    // 3. Not currently loading or speaking
    // 4. The message hasn't been spoken before
    if (voiceMode && 
        lastMessage && 
        lastMessage.type === 'assistant' && 
        !isLoading && 
        !isSpeaking && 
        !spokenMessageIds.has(lastMessage.id)) {
      
      // Mark this message as being spoken
      setIsSpeaking(true);
      setSpokenMessageIds(prev => {
        const newSet = new Set<string>(prev);
        newSet.add(lastMessage.id);
        return newSet;
      });
      
      // Clean the text for speech (remove any markdown or special characters)
      const cleanText = lastMessage.content.replace(/\*\*(.*?)\*\*/g, '$1')
                                          .replace(/\*(.*?)\*/g, '$1');
      
      console.log('Speaking message from chat-bot:', cleanText);
      
      // Use only the direct speech method for better reliability
      if (window.speechSynthesis) {
        try {
          // Cancel any ongoing speech first
          window.speechSynthesis.cancel();
          
          // Create a new utterance
          const utterance = new SpeechSynthesisUtterance(cleanText);
          
          // Set properties
          utterance.volume = 1;
          utterance.rate = 1;
          utterance.pitch = 1;
          
          // Add event listeners
          utterance.onstart = () => console.log('Direct speech started in chat-bot');
          utterance.onend = () => {
            console.log('Direct speech ended in chat-bot');
            setIsSpeaking(false);
          };
          utterance.onerror = (e) => {
            console.error('Direct speech error in chat-bot:', e);
            setIsSpeaking(false);
          };
          
          // Speak the text
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.error('Error starting speech in chat-bot:', error);
          setIsSpeaking(false);
        }
      } else {
        // If speech synthesis isn't available, just mark as done
        console.error('Speech synthesis not supported');
        setIsSpeaking(false);
      }
      
      // Set a fallback timeout in case speech events don't fire properly
      const timeoutDuration = Math.max(5000, cleanText.length * 100);
      const timeout = setTimeout(() => {
        console.log('Fallback timeout for speech ended');
        setIsSpeaking(false);
      }, timeoutDuration);
      
      return () => clearTimeout(timeout);
    }
  }, [messages, voiceMode, isLoading, isSpeaking, spokenMessageIds]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() && !isLoading) {
      handleSendMessage();
    }
  };

  // Toggle voice input
  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
      // If we have input after stopping, send the message
      if (inputValue.trim()) {
        setTimeout(() => handleSendMessage(), 300);
      }
    } else {
      // Clear any existing input before starting to listen
      setInputValue('');
      
      // Start listening but don't auto-submit
      startListening();
      
      toast({
        title: "Voice input active",
        description: "Speak clearly. Press the mic button again to submit.",
      });
    }
  };

  const toggleVoiceMode = () => {
    setVoiceMode(!voiceMode);
    if (!voiceMode) {
      toast({
        title: "Voice mode enabled",
        description: "AI responses will now be spoken aloud",
      });
    } else {
      toast({
        title: "Voice mode disabled",
        description: "AI responses will be text only",
      });
      // Stop any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  };

  // Format message with markdown-like syntax
  const formatMessage = (content: string) => {
    // Convert markdown-like syntax to HTML
    let formattedContent = content;
    
    // Handle bold text: **text** -> <strong>text</strong>
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic text: *text* -> <em>text</em>
    formattedContent = formattedContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Handle line breaks: \n -> <br />
    formattedContent = formattedContent.replace(/\n/g, '<br />');
    
    return formattedContent;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button size="icon" className="rounded-full h-14 w-14 shadow-lg">
            <MessageSquare className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[90vw] sm:w-[400px] p-0 flex flex-col h-[85vh] max-h-[600px]">
          <SheetHeader className="px-4 py-3 border-b">
            <div className="flex justify-between items-center">
              <SheetTitle className="text-xl">AI Assistant</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          
          <ScrollArea className="flex-1 px-4 py-2">
            <div className="flex flex-col gap-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div 
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                      className="whitespace-pre-wrap break-words"
                    />
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-4 py-2 rounded-lg bg-muted">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <SheetFooter className="flex flex-col gap-2 p-4 border-t mt-auto">
            {/* Voice mode controls */}
            <div className="flex justify-between w-full items-center mb-2">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className={`${voiceMode ? 'bg-primary/10' : ''}`}
                        onClick={toggleVoiceMode}
                        disabled={!synthesisSupported}
                      >
                        {voiceMode ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{voiceMode ? 'Disable voice responses' : 'Enable voice responses'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {!synthesisSupported && (
                  <span className="text-xs text-muted-foreground">
                    Voice output not supported in this browser
                  </span>
                )}
              </div>
              
              {/* Voice status indicator */}
              {isSpeaking && (
                <span className="text-xs text-primary animate-pulse">Speaking...</span>
              )}
            </div>
            
            {/* Input area */}
            <div className="flex gap-2 w-full">
              <Input
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading || isListening}
                className="flex-1"
              />
              
              {/* Voice input button */}
              {recognitionSupported && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isListening ? "destructive" : "outline"}
                        size="icon"
                        className={isListening ? "animate-pulse" : ""}
                        onClick={toggleVoiceInput}
                        disabled={isLoading}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{isListening ? 'Stop listening' : 'Start voice input'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {/* Send button */}
              <Button
                size="icon"
                disabled={!inputValue.trim() || isLoading}
                onClick={handleSendMessage}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Listening status */}
            {isListening && (
              <div className="text-xs text-primary-foreground bg-primary px-2 py-1 rounded mt-1 animate-pulse">
                Listening... Say your message clearly. Press the microphone button again to submit.
              </div>
            )}
            
            {/* Browser support warning */}
            {!recognitionSupported && (
              <div className="text-xs text-muted-foreground mt-1">
                Voice input not supported in this browser. Try using Chrome or Edge.
              </div>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}