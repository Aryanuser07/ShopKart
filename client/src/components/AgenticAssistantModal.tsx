import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Sparkles, Bot, ExternalLink, Trash2 } from 'lucide-react';
import { useCurrency } from '../utils/formatCurrency';
import { AITextLoading } from './AITextLoading';
import { AIPromptInput } from './AIPromptInput';
import api from '../services/api';
import { mergeProductsWithCustom } from '../utils/productStorage';

interface AgenticAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const AgenticAssistantModal: React.FC<AgenticAssistantModalProps> = ({ isOpen, onClose, initialQuery }) => {
  const navigate = useNavigate();
  const { format } = useCurrency();
  const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user'; text: string; products?: any[] }>>([
    {
      role: 'ai',
      text: 'Hello! I am your ShopKart Neural AI Shopper. What products, budget, or lifestyle gear are you searching for today?'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const processedQueryRef = useRef<string | null>(null);
  const isExecutingRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && initialQuery && processedQueryRef.current !== initialQuery) {
      processedQueryRef.current = initialQuery;
      executeAgentSearch(initialQuery);
    }
    if (!isOpen) {
      processedQueryRef.current = null;
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  if (!isOpen) return null;

  const quickPrompts = [
    `🎧 ANC Headphones`,
    '👟 Running Sneakers',
    '⌚ Titanium Smartwatches',
    '💡 Ergonomic Lamp'
  ];

  const handleProductClick = (productId: string) => {
    onClose();
    navigate(`/product/${productId}`);
  };

  const handleClearChat = () => {
    processedQueryRef.current = null;
    setMessages([
      {
        role: 'ai',
        text: 'Hello! I am your ShopKart Neural AI Shopper. What products, budget, or lifestyle gear are you searching for today?'
      }
    ]);
  };

  const executeAgentSearch = async (searchText: string) => {
    const trimmed = searchText.trim();
    if (!trimmed || isExecutingRef.current) return;

    isExecutingRef.current = true;
    setLoading(true);

    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last && last.role === 'user' && last.text === trimmed) {
        return prev;
      }
      return [...prev, { role: 'user', text: trimmed }];
    });

    try {
      let storeProducts: any[] = [];
      try {
        const res = await api.get('/products?limit=100');
        storeProducts = mergeProductsWithCustom(res.data.products || []);
      } catch (e) {
        storeProducts = mergeProductsWithCustom([]);
      }

      const q = trimmed.toLowerCase();
      const rawWords = q.split(/\s+/).filter(w => w.length > 1);

      const categorySynonyms: Record<string, string[]> = {
        shoe: ['sneaker', 'footwear', 'running', 'kicks', 'vapormax', 'shoes'],
        shoes: ['sneaker', 'footwear', 'running', 'kicks', 'vapormax', 'shoe'],
        sneaker: ['shoes', 'shoe', 'footwear', 'running', 'vapormax'],
        sneakers: ['shoes', 'shoe', 'footwear', 'running', 'vapormax'],
        watch: ['smartwatch', 'chronos', 'titanium', 'wearables', 'watches'],
        watches: ['smartwatch', 'chronos', 'titanium', 'wearables', 'watch'],
        headphone: ['headphones', 'aura', 'audio', 'anc', 'wireless', 'headset', 'earphone'],
        headphones: ['headphone', 'aura', 'audio', 'anc', 'wireless', 'headset', 'earphone'],
        mouse: ['ultraspeed', 'gaming', 'esports'],
        lamp: ['lumina', 'light', 'desk', 'lighting'],
        bag: ['backpack', 'urban', 'canvas', 'travel', 'bags'],
        backpack: ['bag', 'urban', 'canvas', 'travel', 'bags']
      };

      const scoredProducts = storeProducts.map(p => {
        let score = 0;
        const title = (p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const tags = (p.tags || []).map((t: string) => t.toLowerCase());

        rawWords.forEach(word => {
          const expansions = categorySynonyms[word] || [word];

          expansions.forEach(token => {
            if (title.includes(token)) score += 15;
            if (cat.includes(token)) score += 10;
            if (tags.some((t: string) => t === token || t.includes(token))) score += 12;
            if (brand.includes(token)) score += 8;
            if (desc.includes(token)) score += 2;
          });
        });

        return { product: p, score };
      });

      const maxScore = Math.max(...scoredProducts.map(i => i.score), 0);
      let matched: any[] = [];
      let replyText = '';

      if (maxScore >= 10) {
        const threshold = Math.max(10, maxScore * 0.55);
        matched = scoredProducts
          .filter(item => item.score >= threshold)
          .sort((a, b) => b.score - a.score)
          .map(item => item.product);

        replyText = `Found ${matched.length} top AI-recommended ${matched.length === 1 ? 'match' : 'matches'} for "${trimmed}":`;
      } else {
        matched = storeProducts.slice(0, 3);
        replyText = `We couldn't find an exact match for "${trimmed}" in our store, but here are top trending recommendations:`;
      }

      const formattedMatched = matched.slice(0, 4).map(p => ({
        id: p.id || p._id || 'prod-1',
        title: p.title,
        price: p.price,
        category: p.category,
        image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'),
        rating: p.rating || 4.8,
        stock: p.stock ?? 10
      }));

      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'ai' && last.text === replyText) {
          return prev;
        }
        return [...prev, { role: 'ai', text: replyText, products: formattedMatched }];
      });
    } catch (err) {
      // Fallback
    } finally {
      setLoading(false);
      isExecutingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 sm:p-6">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#faf9f6] border border-slate-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col h-[600px] relative z-50"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-[#eb9800]/30 flex items-center justify-center text-[#eb9800] font-black shadow-xs">
              <Bot className="w-6 h-6 text-[#242b27]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black text-[#242b27]">ShopKart Neural AI Assistant</h3>
                <span className="bg-[#eb9800]/10 text-[#eb9800] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-[#eb9800]/20">
                  Live Agent
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Autonomous Recommendation & Product Finder</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {messages.length > 1 && (
              <button
                type="button"
                onClick={handleClearChat}
                className="flex items-center space-x-1 text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-2.5 py-1 rounded-xl text-xs font-bold transition border border-slate-200 hover:border-rose-200 cursor-pointer shadow-2xs"
                title="Clear chat history"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Clear Chat</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-[#242b27] p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Prompts Ribbon */}
        <div className="px-4 py-2 bg-white/80 border-b border-slate-200/80 overflow-x-auto flex items-center space-x-2 no-scrollbar shrink-0">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => executeAgentSearch(p.replace(/^[^\w]+/, ''))}
              className="shrink-0 text-[11px] font-bold text-[#242b27] bg-white border border-slate-200 hover:border-[#eb9800] hover:text-[#eb9800] px-3 py-1 rounded-xl shadow-2xs transition cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Message Conversation Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain scroll-smooth">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  m.role === 'ai'
                    ? 'bg-[#242b27] text-[#eb9800] shadow-xs'
                    : 'bg-[#eb9800] text-slate-950 font-black'
                }`}
              >
                {m.role === 'ai' ? <Sparkles className="w-4 h-4" /> : 'You'}
              </div>

              <div className={`max-w-[82%] space-y-3 ${m.role === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'ai'
                      ? 'bg-white border border-slate-200 text-[#242b27] font-medium shadow-2xs'
                      : 'bg-[#242b27] text-white font-extrabold shadow-2xs'
                  }`}
                >
                  {m.text}
                </div>

                {/* Product Recommendation Cards */}
                {m.products && m.products.length > 0 && (
                  <div className="grid grid-cols-1 gap-2.5 pt-1 text-left">
                    {m.products.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleProductClick(prod.id)}
                        className="group cursor-pointer flex items-center space-x-3 p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-[#eb9800] transition"
                      >
                        <img
                          src={prod.image}
                          alt={prod.title}
                          className="w-14 h-14 object-cover rounded-xl border border-slate-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-black text-[#242b27] group-hover:text-[#eb9800] transition truncate">
                            {prod.title}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs font-extrabold text-[#eb9800]">{format(prod.price)}</span>
                            <span className="text-[10px] text-slate-400 font-bold">★ {prod.rating}</span>
                            {prod.stock === 0 ? (
                              <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                Out of Stock
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                In Stock
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductClick(prod.id);
                          }}
                          className="bg-[#eb9800] hover:bg-amber-500 text-slate-950 font-black text-[11px] px-3 py-2 rounded-xl shadow-2xs flex items-center space-x-1 shrink-0 transition cursor-pointer"
                        >
                          <span>View Product</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Kokonut UI AITextLoading Shimmer */}
          {loading && (
            <div className="py-2">
              <AITextLoading />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Kokonut UI AIPromptInput */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <AIPromptInput
            onSubmit={(val) => executeAgentSearch(val)}
            headerText="Ask Neural AI Shopper"
            headerAction="Search Engine"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default AgenticAssistantModal;
