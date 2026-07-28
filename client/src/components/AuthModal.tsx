import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Mail, Lock, User as UserIcon, KeyRound, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Text3DFlip from './Text3DFlip';
import api from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, loginWithTokens } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [useOtpMode, setUseOtpMode] = useState(false);
  
  // OTP Verification Step states
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpPurpose, setOtpPurpose] = useState<'signup' | 'login'>('login');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpInput, setOtpInput] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Resend cooldown timer
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const resetState = () => {
    setStep('form');
    setError('');
    setSuccessMsg('');
    setOtpInput('');
  };

  const handleRequestSignupOTP = async () => {
    if (!name || !email || !password) {
      setError('Please fill in your name, email, and password.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register-otp', { name, email, password });
      setOtpPurpose('signup');
      setStep('otp');
      setCooldown(30);
      setSuccessMsg(`🔐 6-digit verification code sent to ${email}. Please check your email inbox.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request signup OTP. Check details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendLoginOTP = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/send-otp', { email });
      setOtpPurpose('login');
      setStep('otp');
      setCooldown(30);
      setSuccessMsg(`🔐 6-digit login code sent to ${email}. Please check your email inbox.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP code. Please check email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length < 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/verify-otp', {
        email,
        otp: otpInput.trim(),
        purpose: otpPurpose
      });

      if (loginWithTokens) {
        loginWithTokens(res.data.user, res.data.tokens);
      } else {
        localStorage.setItem('shopkart_user', JSON.stringify(res.data.user));
        localStorage.setItem('shopkart_token', res.data.tokens?.accessToken || 'token');
        window.location.reload();
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'otp') {
      return handleVerifyOtp(e);
    }

    if (isSignUp) {
      return handleRequestSignupOTP();
    }

    if (useOtpMode) {
      return handleSendLoginOTP();
    }

    // Standard Password Login
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-900 rounded-full bg-slate-100 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* MynaUI Split Screen Architecture */}
          <section className="w-full grid grid-cols-1 md:grid-cols-2 min-h-[520px]">
            
            {/* Left Column: Form Controls */}
            <div className="flex flex-col justify-between p-8 sm:p-10">
              
              <div>
                {/* 3D Animated Logo Header */}
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-[#eb9800] flex items-center justify-center text-slate-950 font-black shadow-xs">
                    <Sparkles className="w-4 h-4 text-slate-950" />
                  </div>
                  <div className="flex items-center text-xl font-black tracking-tight">
                    <Text3DFlip
                      textClassName="text-[#242b27]"
                      flipTextClassName="text-[#eb9800]"
                      rotateDirection="top"
                      staggerDuration={0.03}
                      staggerFrom="first"
                    >
                      Shop
                    </Text3DFlip>
                    <Text3DFlip
                      textClassName="text-[#eb9800]"
                      flipTextClassName="text-[#242b27]"
                      rotateDirection="top"
                      staggerDuration={0.03}
                      staggerFrom="first"
                    >
                      Kart
                    </Text3DFlip>
                  </div>
                </div>

                <hr className="border-slate-200 my-4" />

                {/* Header Title & Mode Toggle */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-black tracking-tight text-[#242b27]">
                      {step === 'otp'
                        ? 'Enter Verification Code'
                        : isSignUp
                        ? 'Create Account'
                        : useOtpMode
                        ? 'Email OTP Login'
                        : 'Login'}
                    </h1>
                    
                    {step === 'form' && !isSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          setUseOtpMode(!useOtpMode);
                          setError('');
                          setSuccessMsg('');
                        }}
                        className="text-xs font-extrabold text-[#eb9800] hover:underline flex items-center space-x-1"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{useOtpMode ? 'Use Password' : 'Use Email OTP'}</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {step === 'otp'
                      ? `We have sent a secure 6-digit OTP code to ${email}`
                      : isSignUp
                      ? 'Enter your name, email & password to verify via OTP'
                      : useOtpMode
                      ? 'Receive a 6-digit security code on your email'
                      : 'Enter your email and password to log in'}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center space-x-2">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-2">
                    <span>📧</span>
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {step === 'form' ? (
                    <>
                      {isSignUp && (
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#242b27]">Full Name</label>
                          <div className="relative">
                            <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input
                              required
                              type="text"
                              placeholder="Priya Natarajan"
                              value={name}
                              onChange={e => setName(e.target.value)}
                              className="w-full bg-[#faf9f6] border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-[#242b27] focus:outline-none focus:border-[#eb9800]"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#242b27]">Email Address</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            required
                            type="email"
                            autoComplete="username"
                            placeholder="team@shopkart.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-[#faf9f6] border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-[#242b27] focus:outline-none focus:border-[#eb9800]"
                          />
                        </div>
                      </div>

                      {(!useOtpMode || isSignUp) && (
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#242b27]">Password</label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input
                              required
                              type="password"
                              placeholder="••••••••••"
                              autoComplete={isSignUp ? 'new-password' : 'current-password'}
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              className="w-full bg-[#faf9f6] border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-[#242b27] focus:outline-none focus:border-[#eb9800]"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-animated-fill btn-animated-gold w-full py-3 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2"
                      >
                        <span>
                          {loading
                            ? 'Processing...'
                            : isSignUp
                            ? 'Create Account & Send OTP'
                            : useOtpMode
                            ? 'Send 6-Digit OTP to Email'
                            : 'Login'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    /* Step 2: 6-Digit OTP Input */
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#242b27]">6-Digit Verification Code</label>
                          <button
                            type="button"
                            disabled={cooldown > 0 || loading}
                            onClick={() => (otpPurpose === 'signup' ? handleRequestSignupOTP() : handleSendLoginOTP())}
                            className="text-[11px] font-extrabold text-[#eb9800] hover:underline disabled:opacity-50 flex items-center space-x-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}</span>
                          </button>
                        </div>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
                          <input
                            required
                            type="text"
                            maxLength={6}
                            autoFocus
                            placeholder="123456"
                            value={otpInput}
                            onChange={e => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full bg-[#faf9f6] border border-amber-300 rounded-xl pl-9 pr-3 py-2.5 text-base font-black tracking-widest text-[#242b27] focus:outline-none focus:border-[#eb9800]"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">Code expires in 5 minutes. Check spam folder if not received.</p>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep('form')}
                          className="px-4 py-3 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={loading || otpInput.length < 6}
                          className="btn-animated-fill btn-animated-gold flex-1 py-3 text-slate-950 font-black text-xs rounded-xl shadow-xs"
                        >
                          {loading ? 'Verifying...' : 'Verify OTP & Complete'}
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 'form' && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('admin@shopkart.com');
                        setPassword('admin123');
                        setUseOtpMode(false);
                      }}
                      className="btn-animated-fill btn-animated-dark w-full py-2.5 text-white font-bold text-xs rounded-xl"
                    >
                      Quick Demo Admin Login
                    </button>
                  )}
                </form>

                {/* Footer Switch Link */}
                <div className="flex flex-col gap-2 text-xs font-medium mt-6 pt-4 border-t border-slate-100">
                  <p className="text-slate-600">
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setUseOtpMode(false);
                        resetState();
                      }}
                      className="underline font-bold text-[#eb9800] hover:text-[#242b27]"
                    >
                      {isSignUp ? 'Login' : 'Sign up'}
                    </button>
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4">
                <p className="text-[11px] text-slate-400 font-medium">© 2026 ShopKart Agentic Suite</p>
              </div>

            </div>

            {/* Right Column: Pattern Background Image */}
            <div className="hidden md:block p-4 relative">
              <img
                loading="lazy"
                decoding="async"
                alt="Pattern background"
                src="https://images.unsplash.com/photo-1698044048234-2e7f6c4e6aca?q=80&w=1000&auto=format"
                className="w-full h-full rounded-2xl border border-slate-200 bg-slate-100 object-cover object-center shadow-inner"
              />
              <div className="absolute inset-4 rounded-2xl bg-gradient-to-t from-[#242b27]/80 via-transparent to-transparent p-6 flex flex-col justify-end text-white">
                <span className="text-xs font-extrabold text-[#f59e0b] uppercase tracking-wider mb-1">Agentic AI Commerce</span>
                <h3 className="text-xl font-black">Experience Next-Gen 3D Shopping</h3>
              </div>
            </div>

          </section>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
