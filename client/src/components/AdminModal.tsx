import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash } from 'lucide-react';
import { Product } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: Partial<Product>) => Promise<void>;
  productToEdit?: Product | null;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  productToEdit
}) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [brand, setBrand] = useState('');
  const [stock, setStock] = useState('15');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setTitle(productToEdit.title);
      setPrice(productToEdit.price.toString());
      setOriginalPrice(productToEdit.originalPrice ? productToEdit.originalPrice.toString() : '');
      setCategory(productToEdit.category);
      setBrand(productToEdit.brand);
      setStock(productToEdit.stock.toString());
      setDescription(productToEdit.description);
      setImageUrl(productToEdit.images[0] || '');
      setFeatures(productToEdit.features || []);
      setIsFeatured(Boolean(productToEdit.isFeatured));
    } else {
      setTitle('');
      setPrice('');
      setOriginalPrice('');
      setCategory('Electronics');
      setBrand('');
      setStock('15');
      setDescription('');
      setImageUrl('https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800');
      setFeatures([]);
      setIsFeatured(false);
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        title,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        category,
        brand,
        stock: Number(stock),
        description,
        images: [imageUrl],
        features,
        isFeatured
      });
      onClose();
    } catch (err) {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">
            {productToEdit ? 'Edit Store Product' : 'Add New Product to ShopKart'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Product Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Price (₹)</label>
              <input
                type="number"
                required
                placeholder="14999"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Original Price (₹)</label>
              <input
                type="number"
                placeholder="19999"
                value={originalPrice}
                onChange={e => setOriginalPrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Initial Stock Qty</label>
              <input
                type="number"
                required
                value={stock}
                onChange={e => setStock(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Electronics">Electronics</option>
                <option value="Fashion & Footwear">Fashion & Footwear</option>
                <option value="Gaming & Wearables">Gaming & Wearables</option>
                <option value="Home & Living">Home & Living</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Brand Name</label>
              <input
                type="text"
                placeholder="e.g. AeroSound / Nike"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Image URL (Cloudinary / Unsplash)</label>
            <div className="flex space-x-2">
              <input
                type="text"
                required
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            {imageUrl && (
              <div className="mt-2 flex items-center space-x-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <img src={imageUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                <span className="text-xs text-slate-400">Live Image Preview</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Full Description</label>
            <textarea
              required
              rows={3}
              placeholder="Describe key selling points, specifications..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Feature Bullet Points</label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                placeholder="e.g. Active Noise Cancellation"
                value={featureInput}
                onChange={e => setFeatureInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="bg-slate-800 hover:bg-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl text-white transition flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {features.map((feat, idx) => (
                <span
                  key={idx}
                  className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-700 flex items-center space-x-1.5"
                >
                  <span>{feat}</span>
                  <button type="button" onClick={() => handleRemoveFeature(idx)} className="text-slate-400 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={e => setIsFeatured(e.target.checked)}
              className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
            />
            <label htmlFor="isFeatured" className="text-xs font-bold text-slate-300 cursor-pointer">
              Mark as Featured Product (Highlight on Homepage)
            </label>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : productToEdit ? 'Update Product' : 'Save & Publish Product'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
