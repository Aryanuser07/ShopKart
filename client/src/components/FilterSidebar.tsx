import React from 'react';
import { Filter, RotateCcw, Star } from 'lucide-react';
import { Category } from '../types';
import { useCurrency } from '../utils/formatCurrency';

interface FilterSidebarProps {
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  maxPrice: number;
  setMaxPrice: (val: number) => void;
  selectedRating: number;
  setSelectedRating: (val: number) => void;
  sortOption: string;
  setSortOption: (sort: string) => void;
  onReset: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  maxPrice,
  setMaxPrice,
  selectedRating,
  setSelectedRating,
  sortOption,
  setSortOption,
  onReset
}) => {
  const { format } = useCurrency();

  const minLimit = 1000;
  const maxLimit = 30000;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-6 sticky top-20 shadow-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-[#eb9800]" />
          <h3 className="text-sm font-bold text-[#242b27]">Filters & Sorting</h3>
        </div>
        <button
          onClick={onReset}
          className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 flex items-center space-x-1 transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Sort By</label>
        <select
          value={sortOption}
          onChange={e => setSortOption(e.target.value)}
          className="w-full bg-[#faf9f6] border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#242b27] focus:outline-none focus:border-[#eb9800] font-medium"
        >
          <option value="newest">Featured & Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Customer Rating</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Category</label>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
              selectedCategory === 'All'
                ? 'bg-amber-100/80 text-amber-900 font-bold border border-amber-300'
                : 'text-slate-600 hover:bg-slate-100 hover:text-[#242b27]'
            }`}
          >
            <span>All Categories</span>
          </button>

          {categories.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.name)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                selectedCategory === cat.name
                  ? 'bg-amber-100/80 text-amber-900 font-bold border border-amber-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#242b27]'
              }`}
            >
              <span className="truncate">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Native Range Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">MAX PRICE</label>
          <span className="text-xs font-black text-[#eb9800] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            {format(maxPrice)}
          </span>
        </div>

        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          step={1000}
          value={maxPrice}
          onChange={e => setMaxPrice(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#eb9800] focus:outline-none"
        />

        <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1.5">
          <span>{format(minLimit)}</span>
          <span>{format(maxLimit)}</span>
        </div>
      </div>

      {/* Customer Rating Filter */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Minimum Rating</label>
        <div className="space-y-1">
          {[4, 3, 2].map(star => (
            <button
              key={star}
              onClick={() => setSelectedRating(selectedRating === star ? 0 : star)}
              className={`w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs transition ${
                selectedRating === star
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#242b27]'
              }`}
            >
              <div className="flex text-amber-500">
                {Array.from({ length: star }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-500" />
                ))}
              </div>
              <span>& above</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
