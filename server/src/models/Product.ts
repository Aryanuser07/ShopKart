import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  brand: string;
  stock: number;
  images: string[];
  rating: number;
  numReviews: number;
  features: string[];
  isFeatured: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    category: { type: String, required: true, index: true },
    brand: { type: String, default: 'ShopKart Generic' },
    stock: { type: Number, required: true, min: 0, default: 10 },
    images: [{ type: String, required: true }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    features: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

ProductSchema.index({ title: 'text', description: 'text', brand: 'text', category: 'text' });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
