import { useEffect, useState } from 'react';

const currencyChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('shopkart_currency_sync') : null;

export const getActiveCurrency = (): string => {
  return localStorage.getItem('shopkart_currency') || 'INR';
};

export const setGlobalCurrency = (newCurrency: string) => {
  localStorage.setItem('shopkart_currency', newCurrency);
  window.dispatchEvent(new Event('shopkart-currency-changed'));
  currencyChannel?.postMessage({ currency: newCurrency });
};

export const formatPrice = (amountInINR: number | string): string => {
  const num = typeof amountInINR === 'string' ? parseFloat(amountInINR.replace(/[^0-9.-]+/g, '')) : amountInINR;
  if (isNaN(num) || num == null) return '₹0';

  const currency = getActiveCurrency();

  if (currency === 'USD') {
    const usd = num * 0.012;
    return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (currency === 'EUR') {
    const eur = num * 0.011;
    return `€${eur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  }
};

export const useCurrency = () => {
  const [currency, setCurrency] = useState<string>(getActiveCurrency());

  useEffect(() => {
    const handleUpdate = () => {
      setCurrency(getActiveCurrency());
    };

    if (currencyChannel) {
      currencyChannel.onmessage = (e) => {
        if (e.data?.currency) {
          localStorage.setItem('shopkart_currency', e.data.currency);
          setCurrency(e.data.currency);
        }
      };
    }

    window.addEventListener('shopkart-currency-changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('shopkart-currency-changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return {
    currency,
    setCurrency: setGlobalCurrency,
    format: (amt: number | string) => formatPrice(amt)
  };
};

export default formatPrice;
