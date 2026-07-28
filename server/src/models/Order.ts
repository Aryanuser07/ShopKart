import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

export interface ITrackingEvent {
  status: string;
  location: string;
  timestamp: Date;
  note?: string;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderItems: IOrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: 'Stripe' | 'COD' | 'TestMode';
  paymentResult?: {
    id?: string;
    status?: string;
    updateTime?: string;
    emailAddress?: string;
  };
  isPaid: boolean;
  paidAt?: Date;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  orderStatus: 'Pending' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Refunded';
  trackingNumber: string;
  estimatedDelivery: Date;
  trackingHistory: ITrackingEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const TrackingEventSchema = new Schema<ITrackingEvent>({
  status: { type: String, required: true },
  location: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String }
});

const OrderSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderItems: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 }
      }
    ],
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: 'India' }
    },
    paymentMethod: { type: String, required: true, default: 'Stripe' },
    paymentResult: {
      id: String,
      status: String,
      updateTime: String,
      emailAddress: String
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    itemsPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded'],
      default: 'Pending'
    },
    trackingNumber: { type: String, required: true },
    estimatedDelivery: { type: Date },
    trackingHistory: [TrackingEventSchema]
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
