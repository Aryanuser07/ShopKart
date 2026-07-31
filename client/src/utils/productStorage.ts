import { Product } from '../types';
import api from '../services/api';

const STORAGE_KEY = 'shopkart_custom_products';
const DELETED_KEY = 'shopkart_deleted_product_ids';

export const getCustomProducts = (): Product[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
};

export const getDeletedProductIds = (): string[] => {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
};

export const saveCustomProduct = (prod: Product): Product[] => {
  const keys = [prod._id, prod.id, prod.slug, prod.title?.trim()].filter(Boolean).map(k => k!.toString().toLowerCase());
  const existing = getCustomProducts();
  const filtered = existing.filter(p => {
    const pKeys = [p._id, p.id, p.slug, p.title?.trim()].filter(Boolean).map(k => k!.toString().toLowerCase());
    return !pKeys.some(pk => keys.includes(pk));
  });
  const updated = [prod, ...filtered];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Remove from deleted list if re-added
  const deleted = getDeletedProductIds().filter(id => !keys.includes(id.toLowerCase()));
  localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));

  // Sync custom product to backend memoryStore for cross-browser visibility
  api.post('/products/sync', { product: prod }).catch(() => {});

  window.dispatchEvent(new Event('shopkart-products-updated'));
  return updated;
};

export const deleteProductFromStorage = (prodOrId: Product | string) => {
  const idsToDelete = new Set<string>();
  if (typeof prodOrId === 'string') {
    if (prodOrId) idsToDelete.add(prodOrId.toLowerCase());
  } else if (prodOrId) {
    if (prodOrId._id) idsToDelete.add(prodOrId._id.toString().toLowerCase());
    if (prodOrId.id) idsToDelete.add(prodOrId.id.toString().toLowerCase());
    if (prodOrId.slug) idsToDelete.add(prodOrId.slug.toString().toLowerCase());
    if (prodOrId.title) idsToDelete.add(prodOrId.title.trim().toLowerCase());
  }

  if (idsToDelete.size === 0) return;

  const custom = getCustomProducts().filter(p => {
    const pKeys = [p._id, p.id, p.slug, p.title?.trim()].filter(Boolean).map(k => k!.toString().toLowerCase());
    return !pKeys.some(pk => idsToDelete.has(pk));
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));

  const deleted = getDeletedProductIds();
  idsToDelete.forEach(id => {
    if (!deleted.includes(id)) {
      deleted.push(id);
    }
  });
  localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));

  window.dispatchEvent(new Event('shopkart-products-updated'));
};

export const deductCustomProductStock = (items: { product: any; quantity: number }[]) => {
  if (!items || items.length === 0) return;
  const custom = getCustomProducts();
  let modified = false;

  items.forEach(item => {
    const p = item.product;
    if (!p) return;
    const qty = Number(item.quantity) || 1;
    const keys = [p._id, p.id, p.slug, p.title?.trim()].filter(Boolean).map(k => k!.toString().toLowerCase());

    const match = custom.find(c => {
      const cKeys = [c._id, c.id, c.slug, c.title?.trim()].filter(Boolean).map(k => k!.toString().toLowerCase());
      return cKeys.some(ck => keys.includes(ck));
    });

    if (match && typeof match.stock === 'number') {
      match.stock = Math.max(0, match.stock - qty);
      modified = true;
    }
  });

  if (modified) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
      window.dispatchEvent(new Event('shopkart-products-updated'));
    } catch (e) {
      // Silent
    }
  }
};

export const mergeProductsWithCustom = (apiProducts: Product[]): Product[] => {
  const custom = getCustomProducts();
  const deletedSet = new Set(getDeletedProductIds().map(id => id.toLowerCase()));

  const customMap = new Map<string, Product>();
  custom.forEach(p => {
    [p._id, p.id, p.slug].filter(Boolean).forEach(k => {
      customMap.set(k!.toString().toLowerCase(), p);
    });
    if (p.title) {
      customMap.set(p.title.trim().toLowerCase(), p);
    }
  });

  if (!apiProducts || apiProducts.length === 0) {
    return custom.filter(p => {
      const keys = [p._id, p.id, p.slug, p.title?.trim()].filter(Boolean).map(k => k!.toString().toLowerCase());
      return !keys.some(k => deletedSet.has(k));
    });
  }

  // Merge API products with local custom overrides, prioritizing live server deducted stock
  const mergedApi = apiProducts.map(apiP => {
    const keys = [apiP._id, apiP.id, apiP.slug, apiP.title?.trim()].filter(Boolean).map(k => k!.toString().toLowerCase());
    let customMatch: Product | undefined;
    for (const k of keys) {
      const match = customMap.get(k);
      if (match) {
        customMatch = match;
        break;
      }
    }

    if (customMatch) {
      const apiReviews = Number(apiP.numReviews || 0);
      const customReviews = Number(customMatch.numReviews || 0);
      const apiRating = Number(apiP.rating || 0);
      const customRating = Number(customMatch.rating || 0);

      const mergedNumReviews = Math.max(apiReviews, customReviews);
      let mergedRating = apiRating;
      if (customReviews > 0 && customRating > 0) {
        mergedRating = customRating;
      } else if (apiRating > 0) {
        mergedRating = apiRating;
      } else if (customRating > 0) {
        mergedRating = customRating;
      }

      const mergedStock = typeof customMatch.stock === 'number' ? customMatch.stock : (typeof apiP.stock === 'number' ? apiP.stock : 0);
      customMatch.stock = mergedStock;
      customMatch.rating = mergedRating;
      customMatch.numReviews = mergedNumReviews;

      return {
        ...apiP,
        ...customMatch,
        rating: mergedRating,
        numReviews: mergedNumReviews,
        stock: mergedStock
      };
    }
    return apiP;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  } catch (e) {
    // Silent
  }

  const apiKeys = new Set<string>();
  apiProducts.forEach(p => {
    [p._id, p.id, p.slug, p.title?.trim()].filter(Boolean).forEach(k => {
      apiKeys.add(k!.toString().toLowerCase());
    });
  });

  const filterApi = mergedApi.filter(p => {
    const keys = [p._id, p.id, p.slug, p.title?.trim()].filter(Boolean).map(k => k!.toString().toLowerCase());
    return !keys.some(k => deletedSet.has(k));
  });

  const customOnly = custom.filter(p => {
    const keys = [p._id, p.id, p.slug, p.title?.trim()].filter(Boolean).map(k => k!.toString().toLowerCase());
    const isDeleted = keys.some(k => deletedSet.has(k));
    const isInApi = keys.some(k => apiKeys.has(k));
    return !isDeleted && !isInApi;
  });

  return [...filterApi, ...customOnly];
};
