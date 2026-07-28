import { Request, Response, NextFunction } from 'express';

/**
 * Validate Auth Signup Input
 */
export const validateSignupInput = (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ message: 'Validation Error: Name must be at least 2 characters long.' });
  }

  if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ message: 'Validation Error: Please provide a valid email address.' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Validation Error: Password must be at least 6 characters long.' });
  }

  next();
};

/**
 * Validate Auth Login Input
 */
export const validateLoginInput = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ message: 'Validation Error: Please provide a valid email address.' });
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ message: 'Validation Error: Password is required.' });
  }

  next();
};

/**
 * Validate Send OTP Input
 */
export const validateSendOtpInput = (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ message: 'Validation Error: Please provide a valid email address.' });
  }

  next();
};

/**
 * Validate Verify OTP Input
 */
export const validateVerifyOtpInput = (req: Request, res: Response, next: NextFunction) => {
  const { email, otp } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ message: 'Validation Error: Please provide a valid email address.' });
  }

  if (!otp || typeof otp !== 'string' || otp.trim().length < 6) {
    return res.status(400).json({ message: 'Validation Error: 6-digit OTP code is required.' });
  }

  next();
};

/**
 * Validate Product Payload Input
 */
export const validateProductInput = (req: Request, res: Response, next: NextFunction) => {
  const { title, price, category, stock } = req.body;

  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    return res.status(400).json({ message: 'Validation Error: Product title cannot be empty.' });
  }

  if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
    return res.status(400).json({ message: 'Validation Error: Price must be a positive number.' });
  }

  if (stock !== undefined && (isNaN(Number(stock)) || Number(stock) < 0)) {
    return res.status(400).json({ message: 'Validation Error: Stock must be a non-negative number.' });
  }

  next();
};

/**
 * Validate Order Creation Input
 */
export const validateOrderInput = (req: Request, res: Response, next: NextFunction) => {
  const { orderItems, shippingAddress } = req.body;

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return res.status(400).json({ message: 'Validation Error: Order must contain at least one item.' });
  }

  for (const item of orderItems) {
    if (!item.title || !item.price || isNaN(Number(item.price)) || Number(item.price) <= 0) {
      return res.status(400).json({ message: 'Validation Error: Invalid item price or title in order payload.' });
    }
    if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
      return res.status(400).json({ message: 'Validation Error: Quantity must be a positive integer.' });
    }
  }

  if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
    return res.status(400).json({ message: 'Validation Error: Shipping address requires street and city.' });
  }

  next();
};
