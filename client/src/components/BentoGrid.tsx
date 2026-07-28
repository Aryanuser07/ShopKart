import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Mic,
  Plus,
  Sparkles,
  Zap,
  Shield,
  CreditCard,
  Database,
  Layers,
  Cpu
} from 'lucide-react';
import {
  motion,
  useMotionValue,
  useTransform,
  type Variants,
} from 'framer-motion';
import { cn } from '../lib/utils';

interface BentoItem {
  id: string;
  title: string;
  description: string;
  icons?: boolean;
  href?: string;
  feature?:
    | 'chart'
    | 'counter'
    | 'code'
    | 'timeline'
    | 'spotlight'
    | 'icons'
    | 'typing'
    | 'metrics';
  spotlightItems?: string[];
  timeline?: Array<{ year: string; event: string }>;
  code?: string;
  typingText?: string;
  className?: string;
}

const bentoItems: BentoItem[] = [
  {
    id: 'main',
    title: 'Building Tomorrow\'s AI E-Commerce Platform',
    description:
      'We architect enterprise-grade shopping experiences that scale seamlessly with Node.js, Express, MongoDB, and Cloud-native microservices.',
    href: '/products',
    feature: 'spotlight',
    spotlightItems: [
      'Stripe Test Mode Payment Gateway',
      'JWT Access & Refresh Token Auth',
      'Mongoose MongoDB Schemas & Seeder',
      'Real-time Step-by-Step Order Tracking',
      'Executive Sales Analytics Dashboard',
    ],
    className: 'col-span-1 md:col-span-2',
  },
  {
    id: 'agent',
    title: 'Agentic AI Shopping Engine',
    description:
      'Autonomous neural agents that understand product specs, budget constraints, and user intent.',
    href: '/products',
    feature: 'typing',
    typingText:
      'const createAgent = async () => {\n  const agent = new ShopKartAI({\n    model: "shopkart-neural-v2",\n    tools: [catalogSearch, pricePredictor],\n    memory: new UserShoppingHistory()\n  });\n\n  await agent.optimizeCatalog();\n  return agent;\n};',
    className: 'col-span-1 md:col-span-2',
  },
  {
    id: 'tech-stack',
    title: 'Powered by Leading Tech',
    description:
      'Engineered with modern full-stack web technologies for peak performance',
    icons: true,
    feature: 'icons',
    className: 'col-span-1 md:col-span-1',
  },
  {
    id: 'roadmap',
    title: 'Platform Timeline',
    description:
      'Milestones of ShopKart\'s e-commerce architecture',
    href: '/products',
    feature: 'timeline',
    timeline: [
      { year: '2024', event: 'Monorepo Architecture Setup' },
      { year: '2025', event: 'Stripe & Cloudinary Integration' },
      { year: '2026', event: 'ShopKart Agentic AI Release' },
    ],
    className: 'col-span-1 md:col-span-1',
  },
];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const SpotlightFeature = ({ items }: { items: string[] }) => (
  <ul className="mt-3 space-y-2">
    {items.map((item, index) => (
      <motion.li
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -10 }}
        key={index}
        transition={{ delay: 0.1 * index }}
      >
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
        <span className="text-slate-700 text-xs font-semibold">
          {item}
        </span>
      </motion.li>
    ))}
  </ul>
);

const IconsFeature = () => (
  <div className="mt-4 grid grid-cols-3 gap-3">
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
      <CreditCard className="h-5 w-5 text-cyan-600" />
      <span className="font-semibold text-slate-800 text-[11px]">Stripe</span>
    </div>
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
      <Database className="h-5 w-5 text-emerald-600" />
      <span className="font-semibold text-slate-800 text-[11px]">MongoDB</span>
    </div>
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
      <Sparkles className="h-5 w-5 text-purple-600" />
      <span className="font-semibold text-slate-800 text-[11px]">Cloudinary</span>
    </div>
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
      <Zap className="h-5 w-5 text-amber-600" />
      <span className="font-semibold text-slate-800 text-[11px]">Redis</span>
    </div>
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
      <Layers className="h-5 w-5 text-blue-600" />
      <span className="font-semibold text-slate-800 text-[11px]">Express</span>
    </div>
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
      <Plus className="h-5 w-5 text-slate-500" />
      <span className="font-semibold text-slate-500 text-[11px]">More</span>
    </div>
  </div>
);

const TimelineFeature = ({
  timeline,
}: {
  timeline: Array<{ year: string; event: string }>;
}) => (
  <div className="relative mt-3">
    <div className="absolute top-0 bottom-0 left-[9px] w-[2px] bg-slate-200" />
    {timeline.map((item, idx) => (
      <motion.div
        animate={{ opacity: 1, x: 0 }}
        className="relative mb-3 flex gap-3"
        initial={{ opacity: 0, x: -10 }}
        key={idx}
        transition={{ delay: 0.15 * idx }}
      >
        <div className="z-10 mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 border-cyan-600 bg-white" />
        <div>
          <div className="font-bold text-slate-900 text-xs">
            {item.year}
          </div>
          <div className="text-slate-600 text-[11px]">
            {item.event}
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

const TypingCodeFeature = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(
        () => {
          setDisplayedText((prev) => prev + text[currentIndex]);
          setCurrentIndex((prev) => prev + 1);

          if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
          }
        },
        Math.random() * 25 + 10
      );

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <div className="relative mt-3">
      <div className="mb-2 flex items-center gap-2 text-slate-500 text-xs font-mono">
        <span>server/src/utils/aiAgent.ts</span>
      </div>
      <div
        className="h-[140px] overflow-y-auto rounded-xl bg-slate-900 p-3 font-mono text-cyan-300 text-xs border border-slate-800 shadow-inner"
        ref={terminalRef}
      >
        <pre className="whitespace-pre-wrap">
          {displayedText}
          <span className="animate-pulse text-white">|</span>
        </pre>
      </div>
    </div>
  );
};

function AIInput_Voice({ onOpenAssistant }: { onOpenAssistant?: (query?: string) => void }) {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [time, setTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    let intervalId: any;
    if (isListening) {
      intervalId = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    } else {
      setTime(0);
    }
    return () => clearInterval(intervalId);
  }, [isListening]);

  const startVoiceSearch = () => {
    setErrorMsg('');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg('Web Speech API not available on this browser. Try quick voice prompts below!');
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
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        const currentTranscript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setErrorMsg('Microphone access denied. You can tap any sample prompt below!');
        } else {
          setErrorMsg(`Voice search note: ${event.error}. You can also tap sample prompts!`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error('Recognition start error:', err);
      setIsListening(false);
      setErrorMsg('Mic initialization error. Try quick voice prompts below.');
    }
  };

  const handleVoiceSubmit = (queryToUse?: string) => {
    const finalQuery = queryToUse || transcript;
    if (!finalQuery.trim()) return;

    if (onOpenAssistant) {
      onOpenAssistant(finalQuery);
    } else {
      navigate(`/products?search=${encodeURIComponent(finalQuery)}`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const samplePrompts = [
    "🎧 ANC Headphones",
    "👟 Running Shoes",
    "⌚ Smartwatch"
  ];

  return (
    <div className="w-full py-2 space-y-2">
      <div className="relative mx-auto flex w-full flex-col items-center gap-2">
        <button
          className={cn(
            'group flex h-14 w-14 items-center justify-center rounded-2xl border transition-all cursor-pointer shadow-xs relative',
            isListening
              ? 'border-rose-500 bg-rose-50 text-rose-600 animate-pulse ring-4 ring-rose-200'
              : 'border-slate-200 bg-slate-50 hover:border-cyan-500/50 text-cyan-600 hover:bg-cyan-50/50'
          )}
          onClick={startVoiceSearch}
          type="button"
          title={isListening ? 'Click to stop listening' : 'Click mic to search by voice'}
        >
          {isListening ? (
            <div className="flex items-center justify-center">
              <Mic className="h-6 w-6 text-rose-600 animate-bounce" />
            </div>
          ) : (
            <Mic className="h-6 w-6 text-cyan-600 group-hover:scale-110 transition-transform" />
          )}
        </button>

        <span className="font-mono text-xs text-slate-500 font-bold">
          {formatTime(time)}
        </span>

        {/* Live Audio Visualizer / Pulse Bars */}
        <div className="flex h-3 w-48 items-center justify-center gap-0.5 my-1">
          {[...Array(32)].map((_, i) => (
            <div
              className={cn(
                'w-0.5 rounded-full transition-all duration-200',
                isListening
                  ? 'bg-cyan-600 animate-pulse'
                  : 'h-1 bg-slate-300'
              )}
              style={{
                height: isListening ? `${((i % 5) + 1) * 3 + 2}px` : '4px'
              }}
              key={i}
            />
          ))}
        </div>

        {/* Transcript or Status Display */}
        <div className="min-h-[28px] text-center px-2">
          {transcript ? (
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800 bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-full inline-block">
                🗣️ "{transcript}"
              </p>
              <button
                onClick={() => handleVoiceSubmit(transcript)}
                className="block text-[11px] font-black text-white bg-cyan-600 hover:bg-cyan-700 px-3.5 py-1 rounded-xl mx-auto shadow-xs transition cursor-pointer"
              >
                Execute Voice Search →
              </button>
            </div>
          ) : isListening ? (
            <p className="text-cyan-600 text-[11px] font-bold animate-pulse">
              🎙️ Listening... Speak your query clearly!
            </p>
          ) : (
            <p className="text-slate-600 text-[11px] font-semibold">
              Click mic to speak OR tap a quick voice command:
            </p>
          )}
        </div>

        {errorMsg && (
          <p className="text-rose-500 text-[10px] font-bold text-center px-2">
            {errorMsg}
          </p>
        )}

        {/* Quick Voice Command Chips */}
        <div className="flex flex-wrap justify-center gap-1.5 pt-1">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleVoiceSubmit(prompt.replace(/^[^\w]+/, ''))}
              className="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300 border border-slate-200 px-2.5 py-1 rounded-lg transition shadow-2xs cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const BentoCard = ({ item, onOpenAssistant }: { item: BentoItem; onOpenAssistant?: (query?: string) => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [2, -2]);
  const rotateY = useTransform(x, [-100, 100], [-2, 2]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct * 100);
    y.set(yPct * 100);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }

  return (
    <motion.div
      className="h-full"
      onHoverEnd={handleMouseLeave}
      onHoverStart={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      variants={fadeInUp}
      whileHover={{ y: -5 }}
    >
      <Link
        className={`group relative flex h-full flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-md backdrop-blur-md transition-all duration-500 hover:border-slate-300 ${item.className}`}
        to={item.href || '#'}
      >
        <div className="relative z-10 flex h-full flex-col justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight group-hover:text-cyan-600 transition-colors">
                {item.title}
              </h3>
              <div className="text-slate-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              {item.description}
            </p>

            {item.feature === 'spotlight' && item.spotlightItems && (
              <SpotlightFeature items={item.spotlightItems} />
            )}

            {item.feature === 'timeline' && item.timeline && (
              <TimelineFeature timeline={item.timeline} />
            )}

            {item.feature === 'icons' && <IconsFeature />}

            {item.feature === 'typing' && item.typingText && (
              <TypingCodeFeature text={item.typingText} />
            )}

            {item.id === 'agent' && onOpenAssistant && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenAssistant();
                  }}
                  className="flex items-center space-x-2 text-xs font-black text-white bg-cyan-600 hover:bg-cyan-700 px-3.5 py-1.5 rounded-xl shadow-xs transition w-fit cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch Neural AI Assistant</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default function BentoGrid({ onOpenAssistant }: { onOpenAssistant?: (query?: string) => void }) {
  return (
    <section className="relative overflow-hidden py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-600">Architecture Overview</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Engineered for High-Performance E-Commerce
          </h2>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial="hidden"
          variants={staggerContainer}
          viewport={{ once: true }}
          whileInView="visible"
        >
          {/* Row 1 */}
          <motion.div className="md:col-span-2" variants={fadeInUp}>
            <BentoCard item={bentoItems[0]} onOpenAssistant={onOpenAssistant} />
          </motion.div>
          
          <motion.div className="md:col-span-1" variants={fadeInUp}>
            <BentoCard item={bentoItems[2]} onOpenAssistant={onOpenAssistant} />
          </motion.div>

          {/* Row 2 */}
          <motion.div className="md:col-span-2" variants={fadeInUp}>
            <BentoCard item={bentoItems[1]} onOpenAssistant={onOpenAssistant} />
          </motion.div>

          {/* Voice Input Card */}
          <motion.div
            className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 backdrop-blur-md md:col-span-1 flex flex-col justify-between shadow-md"
            variants={fadeInUp}
          >
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight mb-1">
                Voice Assistant Search
              </h3>
              <p className="text-slate-600 text-xs">
                Interact with ShopKart AI using natural voice commands for instant product lookups.
              </p>
            </div>
            <AIInput_Voice onOpenAssistant={onOpenAssistant} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
