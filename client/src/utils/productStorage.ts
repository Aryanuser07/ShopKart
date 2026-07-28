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

export const mergeProductsWithCustom = (apiProducts: Product[]): Product[] => {
  if (!apiProducts || apiProducts.length === 0) {
    const custom = getCustomProducts();
    const deletedSet = new Set(getDeletedProductIds().map(id => id.toLowerCase()));
    return custom.filter(p => {
      const keys = [p._id, p.id, p.slug, p.title?.trim()].filter(Boolean).map(k => k!.toString().toLowerCase());
      return !keys.some(k => deletedSet.has(k));
    });
  }

  const custom = getCustomProducts();
  const deletedSet = new Set(getDeletedProductIds().map(id => id.toLowerCase()));

  // 1. Sync local custom products with live API stock values
  const customMap = new Map<string, Product>();
  custom.forEach(p => {
    [p._id, p.id, p.slug].filter(Boolean).forEach(k => {
      customMap.set(k!.toString().toLowerCase(), p);
    });
    if (p.title) {
      customMap.set(p.title.trim().toLowerCase(), p);
    }
  });

  apiProducts.forEach(apiP => {
    const keys = [apiP._id, apiP.id, apiP.slug, apiP.title?.trim()].filter(Boolean).map(k => k!.toString().toLowerCase());
    for (const k of keys) {
      const existingCustom = customMap.get(k);
      if (existingCustom) {
        existingCustom.stock = apiP.stock; // Sync live server stock!
      }
    }
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  } catch (e) {
    // Silent
  }

  // 2. Prioritize live API products and add custom-only products
  const apiKeys = new Set<string>();
  apiProducts.forEach(p => {
    [p._id, p.id, p.slug, p.title?.trim()].filter(Boolean).forEach(k => {
      apiKeys.add(k!.toString().toLowerCase());
    });
  });

  const filterApi = apiProducts.filter(p => {
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
