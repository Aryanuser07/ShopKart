import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownIcon, ArrowUpDown, ArrowUpIcon, Check, ShieldCheck, ShoppingBag } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

interface OrderTransferAnimationProps {
  orderId: string;
  totalPrice: number;
  formattedTotal: string;
  paymentMethod?: string;
  itemsCount?: number;
}

export const OrderTransferAnimation: React.FC<OrderTransferAnimationProps> = ({
  orderId,
  totalPrice,
  formattedTotal,
  paymentMethod = 'Stripe / Credit Card',
  itemsCount = 1
}) => {
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCompleted(true);
    }, 1600);

    return () => clearTimeout(timer);
  }, []);

  const displayId = String(orderId || 'SK-ORD-101').slice(-10).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-lg backdrop-blur-sm transition-all duration-500">
      <div className="flex flex-col items-center justify-center space-y-6">
        
        {/* Animated Icon Circle */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          <motion.div
            animate={{ opacity: [0, 1, 0.8] }}
            className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl"
            initial={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          />

          <AnimatePresence mode="wait">
            {isCompleted ? (
              <motion.div
                key="completed"
                initial={{ opacity: 0, rotate: -180, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="flex h-20 w-20 items-center justify-center"
              >
                <div className="relative z-10 rounded-full border-2 border-emerald-500 bg-emerald-500/10 p-4 text-emerald-600 shadow-md">
                  <Check className="h-10 w-10 text-emerald-600" strokeWidth={3.5} />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, rotate: 360 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="flex h-20 w-20 items-center justify-center"
              >
                <div className="relative z-10">
                  <motion.div
                    animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 border-l-amber-500"
                    transition={{
                      rotate: { duration: 2.5, repeat: Infinity, ease: 'linear' },
                      scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                    }}
                  />
                  <div className="relative z-10 rounded-full bg-[#faf9f6] p-4 text-[#eb9800] shadow-sm border border-slate-200">
                    <ArrowUpDown className="h-9 w-9" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Header */}
        <div className="w-full text-center space-y-1">
          <AnimatePresence mode="wait">
            {isCompleted ? (
              <motion.h2
                key="completed-title"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="font-black text-xl text-[#242b27] uppercase tracking-tight"
              >
                Payment Confirmed
              </motion.h2>
            ) : (
              <motion.h2
                key="progress-title"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="font-black text-xl text-[#242b27] uppercase tracking-tight"
              >
                Processing Order...
              </motion.h2>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isCompleted ? (
              <motion.p
                key="completed-id"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-extrabold text-emerald-700 text-xs flex items-center justify-center space-x-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Transaction Ref: #{displayId}</span>
              </motion.p>
            ) : (
              <motion.p
                key="progress-status"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-bold text-[#eb9800] text-xs"
              >
                Verifying payment with bank...
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Transfer Details Cards */}
        <div className="w-full space-y-3 pt-2">
          
          {/* From Card */}
          <div className="w-full rounded-2xl border border-slate-200 bg-[#faf9f6] p-3.5 transition-all">
            <span className="flex items-center space-x-1.5 font-bold text-[11px] text-slate-500 uppercase tracking-wider mb-1">
              <ArrowUpIcon className="h-3 h-3 text-slate-400" />
              <span>Paid From</span>
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white font-black text-sm text-[#242b27] shadow-xs">
                  $
                </span>
                <div>
                  <p className="font-extrabold text-xs text-[#242b27]">{paymentMethod}</p>
                  <p className="text-[11px] text-slate-400 font-medium">Customer Payment Source</p>
                </div>
              </div>
              <span className="font-black text-xs text-[#242b27]">{formattedTotal}</span>
            </div>
          </div>

          {/* To Card */}
          <div className="w-full rounded-2xl border border-slate-200 bg-[#faf9f6] p-3.5 transition-all">
            <span className="flex items-center space-x-1.5 font-bold text-[11px] text-slate-500 uppercase tracking-wider mb-1">
              <ArrowDownIcon className="h-3 h-3 text-emerald-600" />
              <span>Transferred To</span>
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-amber-300 bg-[#eb9800] font-black text-sm text-slate-950 shadow-xs">
                  <ShoppingBag className="w-4 h-4 text-slate-950" />
                </span>
                <div>
                  <p className="font-extrabold text-xs text-[#242b27]">ShopKart Merchant</p>
                  <p className="text-[11px] text-slate-400 font-medium">{itemsCount} Order Item(s) Reserved</p>
                </div>
              </div>
              <span className="font-black text-xs text-emerald-700">Verified</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default OrderTransferAnimation;
