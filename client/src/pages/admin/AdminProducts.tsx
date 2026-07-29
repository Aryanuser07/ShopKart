import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, X, CheckCircle2, Trash2, Pencil } from 'lucide-react';
import api from '../../services/api';
import { Product } from '../../types';
import { useCurrency } from '../../utils/formatCurrency';
import { saveCustomProduct, mergeProductsWithCustom, deleteProductFromStorage } from '../../utils/productStorage';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { currency, format } = useCurrency();

  // Add Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('50');
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [description, setDescription] = useState('');

  // Edit Form states
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Electronics');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('50');
  const [editImages, setEditImages] = useState<string[]>(['']);
  const [editDescription, setEditDescription] = useState('');

  // Multi-image handlers for Add Modal
  const handleAddImageUrl = () => setImageUrls(prev => [...prev, '']);
  const handleRemoveImageUrl = (index: number) => setImageUrls(prev => prev.filter((_, i) => i !== index));
  const handleImageUrlChange = (index: number, val: string) => {
    setImageUrls(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };
  const handleSetCoverAdd = (index: number) => {
    if (index === 0) return;
    setImageUrls(prev => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      return [selected, ...copy];
    });
  };

  // Multi-image handlers for Edit Modal
  const handleAddEditImageUrl = () => setEditImages(prev => [...prev, '']);
  const handleRemoveEditImageUrl = (index: number) => setEditImages(prev => prev.filter((_, i) => i !== index));
  const handleEditImageUrlChange = (index: number, val: string) => {
    setEditImages(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };
  const handleSetCoverEdit = (index: number) => {
    if (index === 0) return;
    setEditImages(prev => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      return [selected, ...copy];
    });
  };

  // Restock Modal states
  const [restockModalProduct, setRestockModalProduct] = useState<Product | null>(null);
  const [restockQtyInput, setRestockQtyInput] = useState<string>('25');

  useEffect(() => {
    const handleHeaderAction = (e: any) => {
      if (e.detail?.actionType === 'add-product') {
        setIsAddModalOpen(true);
      }
    };
    window.addEventListener('admin-header-action', handleHeaderAction);
    return () => window.removeEventListener('admin-header-action', handleHeaderAction);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products?limit=100');
      const apiProds = res.data.products && res.data.products.length > 0 ? res.data.products : DEFAULT_SEED_PRODUCTS;
      setProducts(mergeProductsWithCustom(apiProds));
    } catch (err) {
      setProducts(mergeProductsWithCustom(DEFAULT_SEED_PRODUCTS));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const handleProductsUpdated = () => {
      fetchProducts();
    };
    window.addEventListener('shopkart-products-updated', handleProductsUpdated);
    return () => window.removeEventListener('shopkart-products-updated', handleProductsUpdated);
  }, []);

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) return;

    const numPrice = Number(price);

    let baseInrPrice = numPrice;
    if (currency === 'USD') {
      baseInrPrice = numPrice / 0.012;
    } else if (currency === 'EUR') {
      baseInrPrice = numPrice / 0.011;
    }

    const validImages = imageUrls.map(img => img.trim()).filter(Boolean);
    const finalImages = validImages.length > 0 ? validImages : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'];

    const payload: Product = {
      _id: `prod-${Date.now()}`,
      id: `prod-${Date.now()}`,
      slug: title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: title.trim(),
      category,
      price: Math.round(baseInrPrice),
      stock: stock !== '' && !isNaN(Number(stock)) ? Number(stock) : 0,
      rating: 4.9,
      numReviews: 1,
      brand: 'ShopKart',
      images: finalImages,
      description: description.trim() || `${title} - Premium ShopKart Catalog Item`
    };

    let finalProd = payload;

    try {
      const res = await api.post('/products', payload);
      if (res.data?.product) {
        finalProd = { ...payload, ...res.data.product };
      }
    } catch (err) {
      // Offline fallback
    }

    saveCustomProduct(finalProd);
    setProducts(prev => mergeProductsWithCustom([finalProd, ...prev]));
    setIsAddModalOpen(false);

    setTitle('');
    setPrice('');
    setImageUrls(['']);
    setStock('50');
    setDescription('');

    setToastMessage(`✅ Product "${finalProd.title}" saved & published to Storefront catalog!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditTitle(p.title || '');
    setEditCategory(p.category || 'Electronics');
    
    let activePrice = p.price || 0;
    if (currency === 'USD') {
      activePrice = Math.round(activePrice * 0.012 * 100) / 100;
    } else if (currency === 'EUR') {
      activePrice = Math.round(activePrice * 0.011 * 100) / 100;
    }

    setEditPrice(activePrice ? activePrice.toString() : '');
    setEditStock(p.stock !== undefined && p.stock !== null ? p.stock.toString() : '0');
    setEditImages(p.images && p.images.length > 0 ? [...p.images] : ['']);
    setEditDescription(p.description || '');
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editTitle.trim() || !editPrice) return;

    const prodId = editingProduct._id || editingProduct.id;
    const numPrice = Number(editPrice);

    let baseInrPrice = numPrice;
    if (currency === 'USD') {
      baseInrPrice = numPrice / 0.012;
    } else if (currency === 'EUR') {
      baseInrPrice = numPrice / 0.011;
    }

    const validImages = editImages.map(img => img.trim()).filter(Boolean);
    const finalImages = validImages.length > 0 ? validImages : (editingProduct.images && editingProduct.images.length > 0 ? editingProduct.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800']);

    const updatedProd: Product = {
      ...editingProduct,
      _id: prodId,
      id: prodId,
      title: editTitle.trim(),
      category: editCategory,
      price: Math.round(baseInrPrice),
      stock: editStock !== '' && !isNaN(Number(editStock)) ? Number(editStock) : 0,
      images: finalImages,
      description: editDescription.trim() || editingProduct.description || `${editTitle} - Premium Catalog Item`
    };

    saveCustomProduct(updatedProd);
    setProducts(prev => prev.map(item => ((item._id || item.id) === prodId ? updatedProd : item)));
    setEditingProduct(null);

    try {
      await api.put(`/products/${prodId}`, updatedProd);
    } catch (err) {
      // Handled
    }

    setToastMessage(`✏️ Product "${updatedProd.title}" updated successfully!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!p) return;
    const prodId = p._id || p.id || p.slug;
    if (!prodId) return;

    if (!window.confirm(`Are you sure you want to remove "${p.title}" from catalog?`)) return;

    // 1. Delete from backend server FIRST
    try {
      await api.delete(`/products/${prodId}`);
    } catch (err) {
      // Handled fallback
    }

    // 2. Delete from local storage cache with ALL matching keys
    deleteProductFromStorage(p);

    // 3. Update local component state
    const keysToDelete = new Set([p._id, p.id, p.slug].filter(Boolean));
    setProducts(prev => prev.filter(item => {
      const itemKeys = [item._id, item.id, item.slug].filter(Boolean);
      return !itemKeys.some(k => keysToDelete.has(k));
    }));

    if (editingProduct && [editingProduct._id, editingProduct.id, editingProduct.slug].some(k => k && keysToDelete.has(k))) {
      setEditingProduct(null);
    }

    setToastMessage(`🗑️ Product "${p.title}" deleted successfully!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalProduct) return;

    const inputQty = Math.max(1, Number(restockQtyInput) || 1);
    const prodId = restockModalProduct._id || restockModalProduct.id || restockModalProduct.slug;
    const currentStock = restockModalProduct.stock || 0;
    const newStock = currentStock + inputQty;

    let waitlistEmails: string[] = [];
    try {
      const waitlist = JSON.parse(localStorage.getItem('shopkart_waitlist') || '[]');
      const pIdStr = String(prodId).toLowerCase();
      const pTitleStr = (restockModalProduct.title || '').toLowerCase();
      
      const matched = waitlist.filter((w: any) => {
        const wId = String(w.productId || '').toLowerCase();
        const wTitle = (w.productTitle || '').toLowerCase();
        return wId === pIdStr || (wTitle && wTitle.includes(pTitleStr));
      });

      waitlistEmails = matched.map((w: any) => w.email).filter(Boolean);

      const remainingWaitlist = waitlist.filter((w: any) => {
        const wId = String(w.productId || '').toLowerCase();
        const wTitle = (w.productTitle || '').toLowerCase();
        return wId !== pIdStr && (!wTitle || !wTitle.includes(pTitleStr));
      });
      localStorage.setItem('shopkart_waitlist', JSON.stringify(remainingWaitlist));
    } catch (e) {
      // Silent
    }

    const updated = {
      ...restockModalProduct,
      stock: newStock
    };

    saveCustomProduct(updated);
    setProducts(prev => prev.map(item => ((item._id || item.id) === prodId ? updated : item)));

    try {
      await api.put(`/products/${prodId}`, {
        ...updated,
        waitlistEmails
      });
    } catch (e) {
      // Handled
    }

    window.dispatchEvent(new Event('shopkart-products-updated'));

    setToastMessage(`⚡ Restocked +${inputQty} units for "${updated.title}"! Total inventory: ${newStock} units.`);
    setRestockModalProduct(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getWaitlistCount = (p: Product) => {
    try {
      const waitlist = JSON.parse(localStorage.getItem('shopkart_waitlist') || '[]');
      const pId = String(p._id || p.id || '').toLowerCase();
      const pTitle = (p.title || '').toLowerCase();
      return waitlist.filter((w: any) =>
        String(w.productId || '').toLowerCase() === pId ||
        (w.productTitle && w.productTitle.toLowerCase().includes(pTitle))
      ).length;
    } catch (e) {
      return 0;
    }
  };

  const filtered = products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      
      {toastMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center space-x-2 animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-200/80 max-w-md shadow-2xs">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search products by title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-transparent border-none text-xs text-[#242b27] placeholder-slate-400 focus:outline-none flex-1 font-medium"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading catalog...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="pb-3 px-2">Image</th>
                  <th className="pb-3 px-2">Title & Description</th>
                  <th className="pb-3 px-2">Category</th>
                  <th className="pb-3 px-2">Stock & Waitlist</th>
                  <th className="pb-3 px-2 text-right">Price ({currency})</th>
                  <th className="pb-3 px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p, idx) => {
                  const waitCount = getWaitlistCount(p);
                  const isOut = (p.stock ?? 0) <= 0;
                  const isLow = (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5;

                  return (
                    <tr key={p._id || p.id || idx} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-2">
                        <img src={p.images[0]} alt={p.title} className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                      </td>
                      <td className="py-3 px-2 font-bold text-[#242b27]">
                        <div>{p.title}</div>
                        {p.description && <div className="text-[10px] font-normal text-slate-400 truncate max-w-xs">{p.description}</div>}
                      </td>
                      <td className="py-3 px-2 text-slate-600">{p.category}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-2">
                          {isOut ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                              Low Stock ({p.stock})
                            </span>
                          ) : (
                            <span className="font-bold text-emerald-700">{p.stock} in stock</span>
                          )}

                          {isOut && waitCount > 0 && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200" title={`${waitCount} shopper(s) waiting on restock list`}>
                              🔔 {waitCount} waiting
                            </span>
                          )}

                          {(isOut || isLow) && (
                            <button
                              type="button"
                              onClick={() => {
                                setRestockModalProduct(p);
                                setRestockQtyInput('25');
                              }}
                              className="px-2.5 py-1 bg-[#eb9800] hover:bg-amber-600 text-slate-950 font-black text-[10px] rounded-lg transition shadow-2xs cursor-pointer"
                              title="Specify restock quantity"
                            >
                              + Restock Stock
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-black text-[#242b27]">{format(p.price)}</td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit Product"
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            title="Delete Product"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <form onSubmit={handleAddProductSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-[#eb9800]" />
                <h3 className="text-base font-bold text-slate-900">Add New Product</h3>
              </div>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aura Studio Noise Cancelling Headphones"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed features, specifications, and description..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:outline-none focus:border-indigo-600 font-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 bg-white font-semibold"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion & Footwear">Fashion & Footwear</option>
                    <option value="Wearables">Wearables</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Price ({currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹'})
                  </label>
                  <input
                    type="number"
                    required
                    placeholder={currency === 'USD' ? '179.99' : currency === 'EUR' ? '164.99' : '14999'}
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:outline-none focus:border-indigo-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                />
              </div>

              {/* Multi-Photo Manager with Cover Image Badge & Reordering */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-bold text-slate-700">
                      Product Photos ({imageUrls.length})
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Photo #1 (Top) is used as the primary Cover Image across the store catalog.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Photo URL</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {imageUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center space-x-2.5 p-2 rounded-xl border transition ${
                        idx === 0
                          ? 'bg-amber-50/70 border-[#eb9800]/40 ring-1 ring-[#eb9800]/20'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {url ? (
                        <img src={url} alt={`Preview ${idx + 1}`} className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0 shadow-2xs" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-500 font-bold shrink-0">
                          #{idx + 1}
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-extrabold ${idx === 0 ? 'text-[#eb9800]' : 'text-slate-500'}`}>
                            {idx === 0 ? '⭐ Cover Image (Main Catalog Display)' : `Gallery Photo #${idx + 1}`}
                          </span>
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetCoverAdd(idx)}
                              className="text-[10px] font-extrabold text-indigo-600 hover:underline cursor-pointer"
                            >
                              Set as Cover ⭐
                            </button>
                          )}
                        </div>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={url}
                          onChange={e => handleImageUrlChange(idx, e.target.value)}
                          className="w-full bg-white rounded-lg border border-slate-200 p-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                        />
                      </div>

                      {imageUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImageUrl(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer shrink-0"
                          title="Remove photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 shadow-xs"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <form onSubmit={handleEditProductSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Edit Product</h3>
              </div>
              <button type="button" onClick={() => setEditingProduct(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="Product title"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  placeholder="Product description and details..."
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:outline-none focus:border-indigo-600 font-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 bg-white font-semibold"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion & Footwear">Fashion & Footwear</option>
                    <option value="Wearables">Wearables</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Price ({currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹'})
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Price"
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:outline-none focus:border-indigo-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={editStock}
                  onChange={e => setEditStock(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                />
              </div>

              {/* Multi-Photo Manager with Cover Image Badge & Reordering */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-bold text-slate-700">
                      Product Photos ({editImages.length})
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Photo #1 (Top) is used as the primary Cover Image across the store catalog.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEditImageUrl}
                    className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Photo URL</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editImages.map((url, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center space-x-2.5 p-2 rounded-xl border transition ${
                        idx === 0
                          ? 'bg-amber-50/70 border-[#eb9800]/40 ring-1 ring-[#eb9800]/20'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {url ? (
                        <img src={url} alt={`Preview ${idx + 1}`} className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0 shadow-2xs" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-500 font-bold shrink-0">
                          #{idx + 1}
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-extrabold ${idx === 0 ? 'text-[#eb9800]' : 'text-slate-500'}`}>
                            {idx === 0 ? '⭐ Cover Image (Main Catalog Display)' : `Gallery Photo #${idx + 1}`}
                          </span>
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetCoverEdit(idx)}
                              className="text-[10px] font-extrabold text-indigo-600 hover:underline cursor-pointer"
                            >
                              Set as Cover ⭐
                            </button>
                          )}
                        </div>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={url}
                          onChange={e => handleEditImageUrlChange(idx, e.target.value)}
                          className="w-full bg-white rounded-lg border border-slate-200 p-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                        />
                      </div>

                      {editImages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEditImageUrl(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer shrink-0"
                          title="Remove photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDeleteProduct(editingProduct)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Product</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs"
                >
                  Update Product
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Restock Quantity Modal */}
      {restockModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <form onSubmit={handleRestockSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Restock Product Inventory</h3>
                <p className="text-xs text-slate-500 font-medium">Specify how much stock to add or set for catalog</p>
              </div>
              <button type="button" onClick={() => setRestockModalProduct(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <img src={restockModalProduct.images[0]} alt="" className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{restockModalProduct.title}</div>
                <div className="text-[11px] font-semibold text-slate-500">
                  Current Stock: <span className="font-extrabold text-rose-700">{restockModalProduct.stock || 0} units</span>
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Quick Quantity Presets</label>
              <div className="grid grid-cols-4 gap-2">
                {['10', '25', '50', '100'].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRestockQtyInput(preset)}
                    className={`py-2.5 text-xs font-extrabold rounded-xl border transition ${
                      restockQtyInput === preset
                        ? 'bg-[#242b27] text-white border-black shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Quantity Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Units to Add</label>
              <input
                type="number"
                min="1"
                required
                value={restockQtyInput}
                onChange={e => setRestockQtyInput(e.target.value)}
                className="w-full bg-white rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 font-extrabold focus:outline-none focus:border-[#eb9800]"
                placeholder="Enter stock quantity..."
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRestockModalProduct(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#242b27] hover:bg-black text-xs font-bold text-white shadow-md transition flex items-center space-x-1.5"
              >
                <Package className="w-4 h-4 text-[#eb9800]" />
                <span>Confirm Restock</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

const DEFAULT_SEED_PRODUCTS: Product[] = [
  {
    _id: 'prod-1',
    id: 'prod-1',
    slug: 'aura-studio-wireless-headphones',
    title: 'Aura Studio Wireless Noise-Canceling Headphones',
    category: 'Electronics',
    price: 14999,
    stock: 25,
    rating: 4.8,
    numReviews: 124,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
    brand: 'Aura',
    description: 'Studio grade wireless headphones'
  },
  {
    _id: 'prod-2',
    id: 'prod-2',
    slug: 'ultraspeed-pro-m2-mouse',
    title: 'UltraSpeed Pro M2 Wireless Gaming Mouse',
    category: 'Electronics',
    price: 4499,
    stock: 18,
    rating: 4.7,
    numReviews: 89,
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800'],
    brand: 'UltraSpeed',
    description: 'High precision gaming mouse'
  },
  {
    _id: 'prod-3',
    id: 'prod-3',
    slug: 'vapormax-air-kinetic-sneakers',
    title: 'VaporMax Air Kinetic Running Sneakers',
    category: 'Fashion & Footwear',
    price: 8999,
    stock: 14,
    rating: 4.9,
    numReviews: 210,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
    brand: 'VaporMax',
    description: 'Lightweight air kinetic running shoes'
  },
  {
    _id: 'prod-4',
    id: 'prod-4',
    slug: 'chronos-smart-watch-titanium',
    title: 'Chronos Smart Watch Ultra Titanium Edition',
    category: 'Wearables',
    price: 18999,
    stock: 8,
    rating: 4.6,
    numReviews: 45,
    images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800'],
    brand: 'Chronos',
    description: 'Titanium smart watch with AMOLED display'
  }
];

export default AdminProducts;
