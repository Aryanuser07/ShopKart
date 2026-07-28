import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Mic, Sparkles } from 'lucide-react';

interface AIPromptInputProps {
  placeholder?: string;
  headerText?: string;
  headerAction?: string;
  onSubmit?: (value: string, model: string) => void;
  className?: string;
}

export const AIPromptInput: React.FC<AIPromptInputProps> = ({
  placeholder = "Ask ShopKart AI for deals, product recommendations, or comparisons...",
  headerText = "ShopKart Neural Shopper",
  headerAction = "AI Mode Active",
  onSubmit,
  className = ""
}) => {
  const [value, setValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleVoiceInput = () => {
    setVoiceError('');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError('Web Speech API not supported on this browser.');
      return;
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setValue(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setVoiceError(event.error === 'not-allowed' ? 'Mic access denied' : 'Voice search error');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Mic start error:', err);
      setIsListening(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSubmit?.(value, "Neural Engine");
        setValue("");
      }
    }
  };

  const handleSend = () => {
    if (value.trim()) {
      onSubmit?.(value, "Neural Engine");
      setValue("");
    }
  };

  return (
    <div className={`w-full py-2 ${className}`}>
      <div className="rounded-2xl border border-slate-200 bg-[#faf9f6] p-2.5 shadow-sm transition hover:border-[#eb9800]/50">
        
        {/* Header Ribbon */}
        <div className="mx-2 mb-2 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#eb9800]" />
            <span className="text-[#242b27] text-xs font-black tracking-tight">
              {headerText}
            </span>
          </div>
          <span className="text-[#242b27]/70 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#eb9800]/10 text-[#eb9800] border border-[#eb9800]/20">
            {headerAction}
          </span>
        </div>

        <div className="relative flex flex-col">
          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "🎙️ Listening... Speak now..." : placeholder}
            rows={1}
            className={`w-full resize-none rounded-xl border px-3.5 py-2.5 text-xs text-[#242b27] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#eb9800] transition ${
              isListening ? 'bg-amber-50/50 border-amber-300 animate-pulse' : 'bg-white border-slate-200/80'
            }`}
          />

          {voiceError && (
            <span className="text-[10px] font-bold text-rose-500 mt-1 px-1">
              {voiceError}
            </span>
          )}

          {/* Bottom Toolbar */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-2 relative">
              
              {/* Speak / Voice Search Button (Replaces model picker) */}
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`flex items-center space-x-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  isListening
                    ? 'border-rose-500 bg-rose-50 text-rose-600 animate-pulse'
                    : 'border-slate-200 bg-white text-[#242b27] hover:border-[#eb9800] hover:bg-amber-50/50'
                }`}
                title={isListening ? 'Click to stop speaking' : 'Click to speak search query'}
              >
                <Mic className={`w-3.5 h-3.5 ${isListening ? 'text-rose-600 animate-bounce' : 'text-[#eb9800]'}`} />
                <span>{isListening ? 'Listening...' : 'Speak Search'}</span>
              </button>
            </div>

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!value.trim()}
              className={`rounded-xl p-2 font-bold text-xs transition flex items-center justify-center ${
                value.trim()
                  ? "bg-[#eb9800] text-slate-950 shadow-sm hover:bg-amber-500 cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIPromptInput;
