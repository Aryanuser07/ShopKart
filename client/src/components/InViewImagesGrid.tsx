import React from 'react';
import { Link } from 'react-router-dom';
import { InView } from './core/in-view';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export function InViewImagesGrid() {
  const departments = [
    {
      title: 'Audio & Acoustics',
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format',
      span: 'col-span-1',
    },
    {
      title: 'Smart Wearables',
      category: 'Gaming & Wearables',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format',
      span: 'col-span-1',
    },
    {
      title: 'Wireless Headsets',
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=800&auto=format',
      span: 'col-span-1',
    },
    {
      title: 'Sneakers & Kicks',
      category: 'Fashion & Footwear',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format',
      span: 'col-span-1',
    },
    {
      title: 'Eyewear & Shades',
      category: 'Fashion & Footwear',
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=800&auto=format',
      span: 'col-span-1',
    },
    {
      title: 'Puma Sportwear',
      category: 'Fashion & Footwear',
      image: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?q=80&w=800&auto=format',
      span: 'col-span-1',
    },
    {
      title: 'Minimalist Watches',
      category: 'Gaming & Wearables',
      image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=800&auto=format',
      span: 'col-span-1',
    },
    {
      title: 'Gaming Accessories',
      category: 'Gaming & Wearables',
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format',
      span: 'col-span-1',
    },
  ];

  return (
    <div className="w-full py-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center space-x-1.5 text-xs font-black text-[#eb9800] uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Department Showcase</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-[#242b27] tracking-tight">Browse Departments</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Scroll to trigger high-definition department visual animations</p>
        </div>

        <Link
          to="/products"
          className="inline-flex items-center space-x-1 text-xs font-extrabold text-[#eb9800] hover:underline shrink-0"
        >
          <span>Explore All Categories</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <InView
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
          }
        }}
      >
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 max-w-7xl mx-auto">
          {departments.map((dept, index) => (
            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.82, filter: 'blur(12px)' },
                visible: { opacity: 1, scale: 1, filter: 'blur(0px)' }
              }}
              transition={{ duration: 0.5 }}
              key={index}
              className="mb-4 overflow-hidden rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition bg-white group"
            >
              <Link to={`/products?category=${encodeURIComponent(dept.category)}`} className="block relative">
                <img
                  src={dept.image}
                  alt={dept.title}
                  className="w-full h-auto rounded-2xl object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#242b27] via-transparent to-transparent p-4 flex flex-col justify-end opacity-95">
                  <span className="text-[10px] font-black text-[#eb9800] uppercase tracking-wider">{dept.category}</span>
                  <h3 className="text-sm font-extrabold text-white group-hover:text-[#eb9800] transition">{dept.title}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </InView>
    </div>
  );
}

export default InViewImagesGrid;
