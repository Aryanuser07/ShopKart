import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { memoryStore } from '../utils/store';

export interface AuthRequest extends Request {
  user?: IUser;
}

const getJwtSecret = () => {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
  }
  return process.env.JWT_SECRET || 'shopkart_super_secret_jwt_key_2026_prod_env';
};

const JWT_SECRET = getJwtSecret();

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    
    // Attempt DB lookup safely or fallback payload for memory/demo IDs
    let user: any = null;
    if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
      try {
        user = await User.findById(decoded.id).select('-password');
      } catch (err) {
        user = null;
      }
    }
    
    if (!user) {
      // Fallback for memory store users
      const memUser = memoryStore.users.find((u: any) => u.id === decoded.id || u._id === decoded.id);
      if (memUser) {
        user = {
          _id: memUser._id || memUser.id,
          id: memUser.id || memUser._id,
          name: memUser.name,
          email: memUser.email,
          role: memUser.role || decoded.role || 'customer',
          addresses: memUser.addresses || [],
          wishlist: memUser.wishlist || []
        };
      } else {
        user = {
          _id: decoded.id,
          id: decoded.id,
          name: decoded.role === 'admin' ? 'ShopKart Admin' : 'Customer User',
          email: decoded.role === 'admin' ? (process.env.ADMIN_EMAIL || 'admin@shopkart.com') : 'customer@shopkart.com',
          role: decoded.role as 'customer' | 'admin',
          addresses: [],
          wishlist: []
        } as any;
      }
    }

    req.user = user as IUser;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
};

export const generateTokens = (id: string, role: string) => {
  const accessToken = jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '1d' });
  const refreshToken = jwt.sign({ id, role }, JWT_SECRET + '_refresh', { expiresIn: '7d' });
  return { accessToken, refreshToken };
};
