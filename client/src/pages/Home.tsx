import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { ArrowRight, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import FlowField from '../components/FlowField';
import { GradientButton } from '../components/GradientButton';
import BentoGrid from '../components/BentoGrid';
import TypewriterTitle from '../components/TypewriterTitle';
import Text3DFlip from '../components/Text3DFlip';
import { InView } from '../components/core/in-view';
import InViewImagesGrid from '../components/InViewImagesGrid';

interface HomeProps {
  onOpenAssistant?: (query?: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onOpenAssistant }) => {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodRes = await api.get('/products?limit=8');
        setFeaturedProducts(prodRes.data.products || []);
      } catch (err) {
        // Handled
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-20 pb-24 overflow-x-hidden bg-[#faf9f6]">
      
      {/* SECTION 1: HERO */}
      <section className="relative min-h-[70vh] flex flex-col justify-start items-start overflow-hidden border-b border-slate-200/60 pt-6">
        
        <FlowField theme="aurora" density="medium">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 text-left py-6 sm:py-10">
            
            {/* Headline with Shop (Black) + Kart (Gold) */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="pt-2 flex items-center space-x-1"
            >
              <Text3DFlip
                className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tight"
                textClassName="text-[#242b27]"
                flipTextClassName="text-[#eb9800]"
                rotateDirection="top"
                staggerDuration={0.04}
                staggerFrom="first"
              >
                Shop
              </Text3DFlip>
              <Text3DFlip
                className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tight"
                textClassName="text-[#eb9800]"
                flipTextClassName="text-[#242b27]"
                rotateDirection="top"
                staggerDuration={0.04}
                staggerFrom="first"
              >
                Kart.
              </Text3DFlip>
            </motion.div>

            {/* Sub-headline Sequence */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="w-full max-w-3xl mt-6 sm:mt-8 mb-4"
            >
              <TypewriterTitle
                className="!text-left"
                sequences={[
                  { text: '• Agentic AI Autonomous Commerce Engine', deleteAfter: true },
                  { text: '• 3D Interactive Product Previews', deleteAfter: true },
                  { text: '• Instant Stripe Test Sandbox Checkout', deleteAfter: true },
                  { text: '• Real-Time Order Tracking & Management', deleteAfter: false },
                ]}
              />
            </motion.div>

            {/* Subtitle Left Aligned */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="mt-3"
            >
              <p className="text-lg sm:text-2xl text-[#242b27]/85 font-medium max-w-2xl leading-relaxed">
                We build memorable e-commerce experiences through AI strategy, 3D product previews, instant checkout and storytelling.
              </p>
            </motion.div>

            {/* Action Buttons Left Aligned */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="flex flex-wrap items-center gap-4 pt-6"
            >
              <Link to="/products">
                <GradientButton variant="gold">
                  <span>Explore AI Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </GradientButton>
              </Link>

              {user?.role === 'admin' && (
                <Link to="/admin">
                  <GradientButton variant="outline">
                    <span>Explore Services</span>
                  </GradientButton>
                </Link>
              )}
            </motion.div>

          </div>
        </FlowField>
      </section>

      {/* SECTION 2: INVIEW BLUR REVEAL BROWSE DEPARTMENTS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <InViewImagesGrid />
      </section>

      {/* SECTION 3: KOKONUT UI BENTO GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <InView
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.6 }}
        >
          <BentoGrid onOpenAssistant={onOpenAssistant} />
        </InView>
      </section>

      {/* SECTION 4: FEATURED PRODUCTS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <InView
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { staggerChildren: 0.08 }
            }
          }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center space-x-2 text-[#eb9800] text-xs font-extrabold uppercase tracking-wider mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Handpicked Highlights</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#242b27] tracking-tight">Featured Products</h2>
            </div>
            <Link to="/products" className="text-xs font-bold text-[#eb9800] hover:underline flex items-center space-x-1">
              <span>See Full Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-80 bg-slate-200/60 rounded-2xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map(product => (
                <motion.div
                  key={product.id || product._id}
                  variants={{
                    hidden: { opacity: 0, scale: 0.9, filter: 'blur(8px)' },
                    visible: { opacity: 1, scale: 1, filter: 'blur(0px)' }
                  }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </InView>
      </section>

    </div>
  );
};
