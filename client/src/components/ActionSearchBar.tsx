import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AudioLines,
  BarChart2,
  LayoutGrid,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  Truck,
  Zap,
  Tag,
  Heart,
  ShieldCheck,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import useDebounce from '../hooks/use-debounce';

export interface Action {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  short?: string;
  end?: string;
  href?: string;
  onSelect?: () => void;
}

interface SearchResult {
  actions: Action[];
}

const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: 'auto',
      transition: {
        height: { duration: 0.35 },
        staggerChildren: 0.08,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        height: { duration: 0.25 },
        opacity: { duration: 0.15 },
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25 },
    },
    exit: {
      opacity: 0,
      y: -8,
      transition: { duration: 0.15 },
    },
  },
} as const;

export function ActionSearchBar({
  defaultOpen = false,
  onClose,
  onOpenAssistant
}: {
  defaultOpen?: boolean;
  onClose?: () => void;
  onOpenAssistant?: () => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isFocused, setIsFocused] = useState(defaultOpen);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 180);

  const shopKartActions: Action[] = useMemo(() => [
    {
      id: '1',
      label: 'Explore Headphones & Audio',
      icon: <Zap className="h-4 w-4 text-cyan-600" />,
      description: 'Electronics',
      short: '⌘E',
      end: 'Catalog',
      href: '/products?category=Electronics'
    },
    {
      id: '2',
      label: 'Running Sneakers & Apparel',
      icon: <ShoppingBag className="h-4 w-4 text-amber-600" />,
      description: 'Fashion',
      short: '⌘F',
      end: 'Catalog',
      href: '/products?category=Fashion%20%26%20Footwear'
    },
    {
      id: '3',
      label: 'Launch Agentic AI Assistant',
      icon: <Sparkles className="h-4 w-4 text-purple-600" />,
      description: 'Neural Search',
      short: '⌘A',
      end: 'AI Agent',
      onSelect: () => {
        if (onOpenAssistant) onOpenAssistant();
      }
    },
    {
      id: '4',
      label: 'Track Active Shipment',
      icon: <Truck className="h-4 w-4 text-emerald-600" />,
      description: 'Order History',
      short: '⌘O',
      end: 'Orders',
      href: '/profile'
    },
    {
      id: '5',
      label: 'Apply Coupon SHOPKART10',
      icon: <Tag className="h-4 w-4 text-pink-600" />,
      description: '10% OFF',
      short: '⌘C',
      end: 'Promo',
      href: '/cart'
    },
    {
      id: '6',
      label: 'Executive Admin Dashboard',
      icon: <ShieldCheck className="h-4 w-4 text-amber-600" />,
      description: 'Admin Portal',
      short: '⌘M',
      end: 'Admin',
      href: '/admin'
    }
  ], [onOpenAssistant]);

  const filteredActions = useMemo(() => {
    if (!debouncedQuery) return shopKartActions;

    const normalizedQuery = debouncedQuery.toLowerCase().trim();
    return shopKartActions.filter((action) => {
      const searchableText = `${action.label} ${action.description || ''} ${action.end || ''}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [debouncedQuery, shopKartActions]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsFocused(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!isFocused) {
      setResult(null);
      setActiveIndex(-1);
      return;
    }

    setResult({ actions: filteredActions });
    setActiveIndex(-1);
  }, [filteredActions, isFocused]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      setActiveIndex(-1);
    },
    []
  );

  const handleExecuteAction = useCallback((action: Action) => {
    setSelectedAction(action);
    if (action.onSelect) {
      action.onSelect();
    } else if (action.href) {
      navigate(action.href);
    } else if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    }
    setIsFocused(false);
    if (onClose) onClose();
  }, [navigate, query, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && query.trim() && (!result?.actions.length || activeIndex === -1)) {
        e.preventDefault();
        navigate(`/products?search=${encodeURIComponent(query.trim())}`);
        setIsFocused(false);
        if (onClose) onClose();
        return;
      }

      if (!result?.actions.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev < result.actions.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : result.actions.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && result.actions[activeIndex]) {
            handleExecuteAction(result.actions[activeIndex]);
          }
          break;
        case 'Escape':
          setIsFocused(false);
          setActiveIndex(-1);
          if (onClose) onClose();
          break;
      }
    },
    [result?.actions, activeIndex, query, navigate, handleExecuteAction, onClose]
  );

  const handleFocus = useCallback(() => {
    setSelectedAction(null);
    setIsFocused(true);
    setActiveIndex(-1);
  }, []);

  return (
    <div className="mx-auto w-full max-w-xl relative">
      <div className="relative flex flex-col items-center justify-start">
        
        {/* Search Input Box */}
        <div className="sticky top-0 z-20 w-full">
          <div className="relative flex items-center">
            <input
              aria-activedescendant={
                activeIndex >= 0 ? `action-${result?.actions[activeIndex]?.id}` : undefined
              }
              aria-autocomplete="list"
              aria-expanded={isFocused && !!result}
              autoComplete="off"
              className="w-full h-11 rounded-xl bg-white border border-slate-200 py-2 pr-10 pl-10 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition shadow-xs backdrop-blur-md"
              id="action-search"
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              placeholder="Search products, brands, or press ⌘K for commands..."
              type="text"
              value={query}
            />

            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Search className="h-4 w-4 text-slate-400" />
            </div>

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              <AnimatePresence mode="popLayout">
                {query.length > 0 ? (
                  <motion.button
                    type="button"
                    onClick={() => {
                      if (query.trim()) {
                        navigate(`/products?search=${encodeURIComponent(query.trim())}`);
                        setIsFocused(false);
                      }
                    }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    key="send"
                    className="p-1 hover:text-slate-900 transition text-slate-400"
                  >
                    <Send className="h-4 w-4 text-cyan-600" />
                  </motion.button>
                ) : (
                  <motion.span
                    animate={{ opacity: 1 }}
                    key="badge"
                    className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200"
                  >
                    ⌘K
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Animated Suggestions Dropdown */}
        <AnimatePresence>
          {isFocused && result && !selectedAction && (
            <motion.div
              animate="show"
              aria-label="Search results"
              className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur-xl"
              exit="exit"
              initial="hidden"
              variants={ANIMATION_VARIANTS.container}
            >
              <motion.ul role="none" className="space-y-1 max-h-72 overflow-y-auto">
                {result.actions.map((action, idx) => (
                  <motion.li
                    aria-selected={activeIndex === idx}
                    className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition ${
                      activeIndex === idx
                        ? 'bg-slate-100 text-slate-900 border border-slate-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                    id={`action-${action.id}`}
                    key={action.id}
                    layout
                    onClick={() => handleExecuteAction(action)}
                    variants={ANIMATION_VARIANTS.item}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="p-1 rounded-lg bg-slate-50 border border-slate-200 shrink-0">
                        {action.icon}
                      </span>
                      <div className="truncate">
                        <span className="font-bold text-xs text-slate-900 block truncate">
                          {action.label}
                        </span>
                        {action.description && (
                          <span className="text-slate-500 text-[10px]">
                            {action.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {action.short && (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                          {action.short}
                        </span>
                      )}
                      {action.end && (
                        <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                          {action.end}
                        </span>
                      )}
                    </div>
                  </motion.li>
                ))}
              </motion.ul>

              <div className="mt-2 border-t border-slate-100 pt-2 px-3 pb-1 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span>Press <strong>⌘K</strong> or <strong>Ctrl+K</strong> anytime</span>
                <span>Use <strong>↑↓</strong> to navigate, <strong>ESC</strong> to close</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default ActionSearchBar;
