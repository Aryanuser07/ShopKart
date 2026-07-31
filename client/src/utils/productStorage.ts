import { Product } from '../types';
import api from '../services/api';

const STORAGE_KEY = 'shopkart_custom_products';
const DELETED_KEY = 'shopkart_deleted_product_ids';

const normalizeKey = (str: string | null | undefined): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
    .replace(/[^a-z0-9]/g, '');
};

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
  const keys = [prod._id, prod.id, prod.slug, prod.title].filter(Boolean).map(k => normalizeKey(k!.toString()));
  const existing = getCustomProducts();
  const filtered = existing.filter(p => {
    const pKeys = [p._id, p.id, p.slug, p.title].filter(Boolean).map(k => normalizeKey(k!.toString()));
    return !pKeys.some(pk => keys.includes(pk));
  });
  const updated = [prod, ...filtered];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Remove from deleted list if re-added
  const deleted = getDeletedProductIds().filter(id => !keys.includes(normalizeKey(id)));
  localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));

  // Sync custom product to backend memoryStore for cross-browser visibility
  api.post('/products/sync', { product: prod }).catch(() => {});

  window.dispatchEvent(new Event('shopkart-products-updated'));
  return updated;
};

export const deleteProductFromStorage = (prodOrId: Product | string) => {
  const idsToDelete = new Set<string>();
  if (typeof prodOrId === 'string') {
    if (prodOrId) idsToDelete.add(normalizeKey(prodOrId));
  } else if (prodOrId) {
    if (prodOrId._id) idsToDelete.add(normalizeKey(prodOrId._id.toString()));
    if (prodOrId.id) idsToDelete.add(normalizeKey(prodOrId.id.toString()));
    if (prodOrId.slug) idsToDelete.add(normalizeKey(prodOrId.slug.toString()));
    if (prodOrId.title) idsToDelete.add(normalizeKey(prodOrId.title));
  }

  if (idsToDelete.size === 0) return;

  const custom = getCustomProducts().filter(p => {
    const pKeys = [p._id, p.id, p.slug, p.title].filter(Boolean).map(k => normalizeKey(k!.toString()));
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
    const keys = [p._id, p.id, p.slug, p.title].filter(Boolean).map(k => normalizeKey(k!.toString()));

    const match = custom.find(c => {
      const cKeys = [c._id, c.id, c.slug, c.title].filter(Boolean).map(k => normalizeKey(k!.toString()));
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
  const deletedSet = new Set(getDeletedProductIds().map(id => normalizeKey(id)));

  const customMap = new Map<string, Product>();
  custom.forEach(p => {
    [p._id, p.id, p.slug, p.title].filter(Boolean).forEach(k => {
      const norm = normalizeKey(k!.toString());
      if (norm) customMap.set(norm, p);
    });
  });

  if (!apiProducts || apiProducts.length === 0) {
    return custom.filter(p => {
      const keys = [p._id, p.id, p.slug, p.title].filter(Boolean).map(k => normalizeKey(k!.toString()));
      return !keys.some(k => deletedSet.has(k));
    });
  }

  // Merge API products with local custom overrides, prioritizing live server deducted stock
  const mergedApi = apiProducts.map(apiP => {
    const rawKeys = [apiP._id, apiP.id, apiP.slug, apiP.title].filter(Boolean).map(k => k!.toString());
    let customMatch: Product | undefined;
    for (const k of rawKeys) {
      const norm = normalizeKey(k);
      if (norm && customMap.has(norm)) {
        customMatch = customMap.get(norm);
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
    [p._id, p.id, p.slug, p.title].filter(Boolean).forEach(k => {
      const norm = normalizeKey(k!.toString());
      if (norm) apiKeys.add(norm);
    });
  });

  const filterApi = mergedApi.filter(p => {
    const keys = [p._id, p.id, p.slug, p.title].filter(Boolean).map(k => normalizeKey(k!.toString()));
    return !keys.some(k => deletedSet.has(k));
  });

  const customOnly = custom.filter(p => {
    const keys = [p._id, p.id, p.slug, p.title].filter(Boolean).map(k => normalizeKey(k!.toString()));
    const isDeleted = keys.some(k => deletedSet.has(k));
    const isInApi = keys.some(k => apiKeys.has(k));
    return !isDeleted && !isInApi;
  });

  return [...filterApi, ...customOnly];
};
