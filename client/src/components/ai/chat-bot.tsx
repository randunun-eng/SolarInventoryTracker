import { useState, useRef, useEffect } from 'react';
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
  const [voiceMode, setVoiceMode] = useState(false);
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

  // Effect to handle speech transcript updates
  useEffect(() => {
    if (transcript && isListening) {
      setInputValue(transcript);
    }
  }, [transcript, isListening]);

  // Effect to handle speaking of assistant responses
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (voiceMode && lastMessage && lastMessage.type === 'assistant' && !isLoading && !isSpeaking) {
      setIsSpeaking(true);
      
      // Clean the text for speech (remove any markdown or special characters)
      const cleanText = lastMessage.content.replace(/\*\*(.*?)\*\*/g, '$1')
                                          .replace(/\*(.*?)\*/g, '$1');
      
      speak(cleanText);
      
      // Set a timeout for when speaking is complete (roughly based on content length)
      const timeoutDuration = Math.max(2000, cleanText.length * 90); // ~90ms per character
      const timeout = setTimeout(() => {
        setIsSpeaking(false);
      }, timeoutDuration);
      
      return () => clearTimeout(timeout);
    }
  }, [messages, voiceMode, isLoading, isSpeaking, speak]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() && !isLoading) {
      handleSendMessage();
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      // Auto-submit after a pause in speaking
      setTimeout(() => {
        if (inputValue.trim()) {
          handleSendMessage();
        }
      }, 3000);
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

  const handleSendMessage = async () => {
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
      const response = await apiRequest<{ sessionId: string; response: string }>({
        url: '/api/chat',
        method: 'POST',
        body: {
          sessionId,
          message: userMessage.content,
        },
      });
      
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Math.random().toString(36).substring(2, 15),
          content: response.response,
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
                Listening... Say your message clearly.
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