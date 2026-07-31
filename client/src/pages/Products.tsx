import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Package } from 'lucide-react';
import api from '../services/api';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { FilterSidebar } from '../components/FilterSidebar';
import { InView } from '../components/core/in-view';
import { motion } from 'framer-motion';
import { mergeProductsWithCustom } from '../utils/productStorage';

export const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  // Filter States
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [maxPrice, setMaxPrice] = useState<number>(30000);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [sortOption, setSortOption] = useState<string>('newest');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    const cat = searchParams.get('category');
    const q = searchParams.get('search');
    if (cat) setSelectedCategory(cat);
    if (q !== null) setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/products/categories');
        setCategories(res.data.categories || []);
      } catch (err) {
        // Silent
      }
    };
    fetchCategories();
  }, []);

  // Trigger skeleton loader animation whenever maxPrice or filters change
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => setIsFiltering(false), 200);
    return () => clearTimeout(timer);
  }, [maxPrice, selectedCategory, sortOption, search, selectedRating]);

  const fetchProducts = async (isInitial = false) => {
    if (isInitial || products.length === 0) {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (maxPrice < 30000) params.append('maxPrice', maxPrice.toString());
      if (selectedRating > 0) params.append('rating', selectedRating.toString());
      if (sortOption) params.append('sort', sortOption);
      params.append('page', page.toString());
      params.append('limit', '100');

      const res = await api.get(`/products?${params.toString()}`);
      let merged = mergeProductsWithCustom(res.data.products || []);

      // Filter merged items by category if selectedCategory !== 'All'
      if (selectedCategory !== 'All') {
        const targetCategoryStr = selectedCategory.toLowerCase().trim();
        merged = merged.filter(p => {
          const pCat = (p.category || '').toLowerCase().trim();
          return pCat === targetCategoryStr || pCat.includes(targetCategoryStr) || targetCategoryStr.includes(pCat);
        });
      }

      if (search) {
        const s = search.toLowerCase();
        merged = merged.filter(p => p.title.toLowerCase().includes(s) || p.category.toLowerCase().includes(s));
      }

      if (maxPrice < 30000) {
        merged = merged.filter(p => p.price <= maxPrice);
      }

      if (selectedRating > 0) {
        merged = merged.filter(p => p.rating >= selectedRating);
      }

      if (sortOption === 'price-asc') {
        merged.sort((a, b) => a.price - b.price);
      } else if (sortOption === 'price-desc') {
        merged.sort((a, b) => b.price - a.price);
      } else if (sortOption === 'rating') {
        merged.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sortOption === 'popular') {
        merged.sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0));
      } else if (sortOption === 'newest') {
        merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }

      setProducts(merged);
      setTotalPages(res.data.pages || 1);
      setTotalProducts(merged.length);
    } catch (err) {
      let merged = mergeProductsWithCustom([]);
      if (selectedCategory !== 'All') {
        const targetCategoryStr = selectedCategory.toLowerCase().trim();
        merged = merged.filter(p => (p.category || '').toLowerCase().trim() === targetCategoryStr);
      }
      setProducts(merged);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(true);
    const handleProductsUpdated = () => fetchProducts(false);
    window.addEventListener('shopkart-products-updated', handleProductsUpdated);
    window.addEventListener('focus', handleProductsUpdated);

    return () => {
      window.removeEventListener('shopkart-products-updated', handleProductsUpdated);
      window.removeEventListener('focus', handleProductsUpdated);
    };
  }, [search, selectedCategory, maxPrice, selectedRating, sortOption, page]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setMaxPrice(30000);
    setSelectedRating(0);
    setSortOption('newest');
    setPage(1);
    setSearchParams({});
  };

  return (
    <InView className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-[#faf9f6]">
      
      {/* Header & Mobile Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#242b27] tracking-tight">Product Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Showing {products.length} items available in ShopKart store
          </p>
        </div>

        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          className="lg:hidden flex items-center justify-center space-x-2 bg-white border border-slate-200 text-[#242b27] px-4 py-2 rounded-xl text-xs font-bold shadow-xs"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#eb9800]" />
          <span>{mobileFilterOpen ? 'Hide Filters' : 'Show Filters & Sort'}</span>
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Filters (Desktop & Mobile) */}
        <div className={`lg:col-span-3 ${mobileFilterOpen ? 'block' : 'hidden lg:block'}`}>
          <FilterSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            selectedRating={selectedRating}
            setSelectedRating={setSelectedRating}
            sortOption={sortOption}
            setSortOption={setSortOption}
            onReset={handleResetFilters}
          />
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-9 space-y-6">
          
          {loading || isFiltering ? (
            /* Skeleton Cards Loader */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs animate-pulse">
                  <div className="h-4 w-4/5 bg-slate-200/80 rounded" />
                  <div className="h-4 w-2/3 bg-slate-200/80 rounded" />
                  <div className="h-52 w-full bg-slate-200/80 rounded-xl" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-8 w-20 bg-slate-200/80 rounded-lg" />
                    <div className="h-8 w-20 bg-slate-200/80 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#242b27]">No Products Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No items match your selected filter criteria. Try resetting filters or searching with a different term.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2 bg-[#f59e0b] hover:bg-[#eb9800] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <InView
              variants={{
                hidden: { opacity: 0, scale: 0.96, filter: 'blur(6px)' },
                visible: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.25, staggerChildren: 0.04 } }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {products.map(product => (
                <motion.div
                  key={product.id || product._id}
                  variants={{
                    hidden: { opacity: 0, scale: 0.94, filter: 'blur(4px)' },
                    visible: { opacity: 1, scale: 1, filter: 'blur(0px)' }
                  }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </InView>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 pt-6 border-t border-slate-200/80">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold text-[#242b27] rounded-lg disabled:opacity-40 hover:bg-slate-50 shadow-xs"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-slate-500 px-3">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold text-[#242b27] rounded-lg disabled:opacity-40 hover:bg-slate-50 shadow-xs"
              >
                Next
              </button>
            </div>
          )}

        </div>

      </div>

    </InView>
  );
};

export default Products;
