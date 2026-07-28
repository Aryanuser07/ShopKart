import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, Truck, ArrowRight, ShieldCheck, Sparkles, ShoppingBag } from 'lucide-react';
import api from '../services/api';
import { Order } from '../types';
import { useCurrency } from '../utils/formatCurrency';
import { InView } from '../components/core/in-view';
import Text3DFlip from '../components/Text3DFlip';
import OrderTransferAnimation from '../components/OrderTransferAnimation';

export const OrderSuccessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { format } = useCurrency();

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      let foundOrder: any = null;

      try {
        if (id) {
          const res = await api.get(`/orders/${id}`);
          foundOrder = res.data.order;
        }
      } catch (err) {
        // Search local storage
      }

      if (!foundOrder && id) {
        try {
          const localOrders = JSON.parse(localStorage.getItem('shopkart-custom-orders') || '[]');
          const targetId = String(id).toLowerCase();
          foundOrder = localOrders.find((o: any) => {
            const oId = String(o._id || o.id || '').toLowerCase();
            return oId === targetId || oId.endsWith(targetId) || targetId.endsWith(oId);
          });
        } catch (e) {
          // Silent
        }
      }

      if (!foundOrder) {
        // Fallback demo order for preview
        foundOrder = {
          _id: id || 'DEMO-101',
          id: id || 'DEMO-101',
          trackingNumber: 'SK-' + Math.floor(1000000 + Math.random() * 9000000),
          orderItems: [
            {
              product: 'prod-1',
              title: 'Aura Studio Wireless Noise-Canceling Headphones',
              quantity: 1,
              price: 14999,
              image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
            }
          ],
          shippingAddress: { street: '42 MG Road', city: 'Bengaluru', state: 'KA', postalCode: '560038', country: 'India' },
          paymentMethod: 'Stripe',
          taxPrice: 2700,
          shippingPrice: 0,
          totalPrice: 17699,
          isPaid: true,
          orderStatus: 'Processing',
          createdAt: new Date().toISOString(),
          estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
        };
      }

      setOrder(foundOrder);
      setLoading(false);
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center bg-[#faf9f6]">
        <div className="w-12 h-12 border-4 border-[#eb9800] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-500 font-bold">Verifying Order Confirmation...</p>
      </div>
    );
  }

  const orderDisplayId = String(id || order?._id || order?.id || 'CONFIRMED').slice(-8).toUpperCase();

  return (
    <div className="min-h-[80vh] bg-[#faf9f6] py-12 px-4 sm:px-6 lg:px-8">
      <InView
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
        }}
        className="max-w-3xl mx-auto space-y-8 text-center"
      >
        
        {/* Header Title */}
        <div className="space-y-3">
          <div className="flex items-center justify-center text-3xl font-black tracking-tight">
            <Text3DFlip
              textClassName="text-[#242b27]"
              flipTextClassName="text-[#eb9800]"
              rotateDirection="top"
              staggerDuration={0.03}
            >
              Order Placed
            </Text3DFlip>
            <span className="ml-2 text-[#eb9800]">Successfully!</span>
          </div>

          <p className="text-sm text-slate-600 font-medium max-w-lg mx-auto leading-relaxed">
            Thank you for shopping with ShopKart! Your order <strong className="text-[#242b27] font-black">#{orderDisplayId}</strong> has been registered and is being prepared for dispatch.
          </p>
        </div>

        {/* Kokonut UI CurrencyTransfer Order Transfer Animation */}
        {order && (
          <OrderTransferAnimation
            orderId={order._id || order.id || 'SK-101'}
            totalPrice={order.totalPrice}
            formattedTotal={format(order.totalPrice)}
            paymentMethod={order.paymentMethod === 'Stripe' ? 'Stripe Checkout ••••4242' : 'Cash on Delivery (COD)'}
            itemsCount={order.orderItems?.length || 1}
          />
        )}

        {/* Order Details Card */}
        {order && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 text-left space-y-6 shadow-sm hover:shadow-md transition">
            
            {/* Top Status Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Payment Status</span>
                <p className="text-xs font-black text-emerald-700 flex items-center space-x-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/80 w-fit">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified & Paid</span>
                </p>
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Estimated Delivery</span>
                <p className="text-xs font-black text-[#242b27] flex items-center sm:justify-end space-x-1.5">
                  <Truck className="w-4 h-4 text-[#eb9800]" />
                  <span>
                    {order.estimatedDelivery
                      ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                      : '3-4 Business Days'}
                  </span>
                </p>
              </div>
            </div>

            {/* Purchased Items */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-[#242b27] uppercase tracking-wider flex items-center space-x-2">
                <Package className="w-4 h-4 text-[#eb9800]" />
                <span>Purchased Items ({order.orderItems?.length || 0})</span>
              </h4>

              <div className="space-y-3">
                {(order.orderItems || []).map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-4 p-3 bg-[#faf9f6] rounded-2xl border border-slate-100">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200 bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-extrabold text-[#242b27] truncate">{item.title}</h5>
                      <p className="text-[11px] text-slate-500 font-bold mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-black text-[#242b27]">
                      {format(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">Grand Total Paid</span>
                <p className="text-[11px] text-slate-400">Includes taxes & shipping</p>
              </div>
              <span className="text-xl font-black text-[#eb9800]">
                {format(order.totalPrice)}
              </span>
            </div>

          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to={`/order-tracking/${id}`}
            className="btn-animated-fill btn-animated-gold w-full sm:w-auto px-8 py-3.5 text-slate-950 font-black text-xs rounded-2xl shadow-sm flex items-center justify-center space-x-2 transition"
          >
            <Truck className="w-4 h-4" />
            <span>Track Shipment Live</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/products"
            className="btn-animated-fill btn-animated-dark w-full sm:w-auto px-8 py-3.5 text-white font-bold text-xs rounded-2xl flex items-center justify-center space-x-2 transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>

      </InView>
    </div>
  );
};
