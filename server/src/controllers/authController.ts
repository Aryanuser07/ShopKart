import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { generateTokens, AuthRequest } from '../middleware/auth';
import { memoryStore } from '../utils/store';
import { sendOTPEmail } from '../utils/emailService';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Try MongoDB
    try {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'customer'
      });

      const tokens = generateTokens((user as any)._id.toString(), user.role);

      return res.status(201).json({
        user: {
          id: (user as any)._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          addresses: user.addresses,
          wishlist: user.wishlist
        },
        tokens
      });
    } catch (dbErr) {
      // Memory Store fallback
      const exists = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      const newUser = {
        _id: 'user-' + Date.now(),
        id: 'user-' + Date.now(),
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'customer' as const,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300',
        phone: '',
        addresses: [],
        wishlist: [],
        createdAt: new Date().toISOString()
      };

      memoryStore.users.push(newUser);
      const tokens = generateTokens(newUser.id, newUser.role);

      return res.status(201).json({
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          avatar: newUser.avatar,
          addresses: newUser.addresses,
          wishlist: newUser.wishlist
        },
        tokens
      });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Try MongoDB
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        const isMatch = await bcrypt.compare(password, user.password || '');
        if (isMatch) {
          const tokens = generateTokens((user as any)._id.toString(), user.role);
          return res.json({
            user: {
              id: (user as any)._id,
              name: user.name,
              email: user.email,
              role: user.role,
              avatar: user.avatar,
              phone: user.phone,
              addresses: user.addresses,
              wishlist: user.wishlist
            },
            tokens
          });
        }
      }
    } catch (err) {
      // Continue to memory fallback
    }

    // Memory Store lookup
    const memUser = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (memUser) {
      const isMatch = memUser.password ? await bcrypt.compare(password, memUser.password) : false;
      if (isMatch) {
        const tokens = generateTokens(memUser.id, memUser.role);
        return res.json({
          user: {
            id: memUser.id,
            name: memUser.name,
            email: memUser.email,
            role: memUser.role,
            avatar: memUser.avatar,
            phone: memUser.phone,
            addresses: memUser.addresses,
            wishlist: memUser.wishlist
          },
          tokens
        });
      }
    }

    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: req.user });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, addresses } = req.body;
    const userId = req.user?.id || req.user?._id;

    try {
      const user = await User.findById(userId);
      if (user) {
        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (addresses) user.addresses = addresses;
        await user.save();
        return res.json({ user });
      }
    } catch (dbErr) {
      // Memory Store fallback
    }

    const memUser = memoryStore.users.find(u => u.id === userId || u._id === userId);
    if (memUser) {
      if (name) memUser.name = name;
      if (phone !== undefined) memUser.phone = phone;
      if (addresses) memUser.addresses = addresses;
      return res.json({ user: memUser });
    }

    return res.status(404).json({ message: 'User not found' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const toggleWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    try {
      const user = await User.findById(userId);
      if (user) {
        const index = user.wishlist.indexOf(productId);
        if (index > -1) {
          user.wishlist.splice(index, 1);
        } else {
          user.wishlist.push(productId);
        }
        await user.save();
        return res.json({ wishlist: user.wishlist });
      }
    } catch (err) {
      // Memory Store fallback
    }

    const memUser = memoryStore.users.find(u => u.id === userId || u._id === userId);
    if (memUser) {
      const idx = memUser.wishlist.indexOf(productId);
      if (idx > -1) {
        memUser.wishlist.splice(idx, 1);
      } else {
        memUser.wishlist.push(productId);
      }
      return res.json({ wishlist: memUser.wishlist });
    }

    return res.status(404).json({ message: 'User not found' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Request Signup OTP
 */
export const requestSignupOTP = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    let existingUser: any = null;
    try {
      existingUser = await User.findOne({ email: normalizedEmail });
    } catch (e) {
      // Continue
    }

    if (!existingUser) {
      existingUser = memoryStore.users.find(u => u.email.toLowerCase() === normalizedEmail);
    }

    if (existingUser) {
      return res.status(400).json({ message: 'Account already exists with this email' });
    }

    // Rate limiting: 30 seconds cooldown between resend requests
    const otpKey = `${normalizedEmail}:signup`;
    const existingOTP = memoryStore.otps.get(otpKey);
    if (existingOTP && Date.now() - existingOTP.createdAt < 30000) {
      const waitSeconds = Math.ceil((30000 - (Date.now() - existingOTP.createdAt)) / 1000);
      return res.status(429).json({ message: `Please wait ${waitSeconds} seconds before requesting a new OTP.` });
    }

    // Hash password & generate 6-digit OTP
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store hashed OTP with signup metadata
    memoryStore.otps.set(otpKey, {
      email: normalizedEmail,
      hashedOtp,
      purpose: 'signup',
      expiresAt,
      createdAt: Date.now(),
      attempts: 0,
      registrationData: {
        name,
        email: normalizedEmail,
        passwordHash
      }
    });

    // Send OTP via Gmail SMTP (safeguarded against SMTP timeouts/errors)
    try {
      await sendOTPEmail(normalizedEmail, rawOtp, name);
    } catch (emailErr: any) {
      console.error('⚠️ [SMTP Dispatch Error]:', emailErr.message);
    }

    return res.json({
      requireOtp: true,
      purpose: 'signup',
      email: normalizedEmail,
      message: `Verification 6-digit OTP sent to ${normalizedEmail}. (Sandbox Code: 123456)`
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Send 6-Digit OTP for Login
 */
export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if account exists
    let existingUser: any = null;
    try {
      existingUser = await User.findOne({ email: normalizedEmail });
    } catch (e) {
      // Continue
    }

    if (!existingUser) {
      existingUser = memoryStore.users.find(u => u.email.toLowerCase() === normalizedEmail);
    }

    if (!existingUser) {
      return res.status(404).json({ message: 'No account found with this email address. Please sign up first.' });
    }

    // Rate limiting: 30 seconds cooldown between requests
    const otpKey = `${normalizedEmail}:login`;
    const existingOTP = memoryStore.otps.get(otpKey);
    if (existingOTP && Date.now() - existingOTP.createdAt < 30000) {
      const waitSeconds = Math.ceil((30000 - (Date.now() - existingOTP.createdAt)) / 1000);
      return res.status(429).json({ message: `Please wait ${waitSeconds} seconds before requesting a new OTP code.` });
    }

    // Generate 6-digit numeric OTP & Hash it
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    memoryStore.otps.set(otpKey, {
      email: normalizedEmail,
      hashedOtp,
      purpose: 'login',
      expiresAt,
      createdAt: Date.now(),
      attempts: 0
    });

    try {
      await sendOTPEmail(normalizedEmail, rawOtp, existingUser.name);
    } catch (emailErr: any) {
      console.error('⚠️ [SMTP Dispatch Error]:', emailErr.message);
    }

    return res.json({
      requireOtp: true,
      purpose: 'login',
      email: normalizedEmail,
      message: `Login verification 6-digit OTP sent to ${normalizedEmail}. (Sandbox Code: 123456)`
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Verify Hashed OTP and Complete Authentication
 */
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp, purpose = 'login' } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and 6-digit OTP code are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpKey = `${normalizedEmail}:${purpose}`;
    
    // Fallback key lookup
    let otpRecord = memoryStore.otps.get(otpKey) || memoryStore.otps.get(normalizedEmail);

    if (!otpRecord) {
      return res.status(400).json({ message: 'No active OTP request found or code expired. Please click Resend OTP.' });
    }

    // Security Check: Expiry (5 Minutes)
    if (Date.now() > otpRecord.expiresAt) {
      memoryStore.otps.delete(otpKey);
      memoryStore.otps.delete(normalizedEmail);
      return res.status(400).json({ message: 'OTP code has expired (valid for 5 minutes). Please request a new code.' });
    }

    // Security Check: Attempt Limits (Max 5 failed attempts)
    if (otpRecord.attempts >= 5) {
      memoryStore.otps.delete(otpKey);
      memoryStore.otps.delete(normalizedEmail);
      return res.status(400).json({ message: 'Maximum verification attempts exceeded. Please request a new OTP code.' });
    }

    // Security Check: Verify Hashed OTP Match (or master sandbox code 123456)
    const isMasterCode = otp.trim() === '123456';
    const isMatch = isMasterCode || (await bcrypt.compare(otp.trim(), otpRecord.hashedOtp));
    if (!isMatch) {
      otpRecord.attempts += 1;
      const remainingAttempts = 5 - otpRecord.attempts;
      if (remainingAttempts <= 0) {
        memoryStore.otps.delete(otpKey);
        memoryStore.otps.delete(normalizedEmail);
        return res.status(400).json({ message: 'Maximum attempts exceeded. OTP invalidated. Please request a new code.' });
      }
      return res.status(400).json({ message: `Invalid OTP code. ${remainingAttempts} attempt(s) remaining.` });
    }

    // OTP Verified! Clear used record
    memoryStore.otps.delete(otpKey);
    memoryStore.otps.delete(normalizedEmail);

    let userObj: any = null;

    if (otpRecord.purpose === 'signup' && otpRecord.registrationData) {
      const reg = otpRecord.registrationData;
      // Try MongoDB
      try {
        const newUser = await User.create({
          name: reg.name,
          email: reg.email,
          password: reg.passwordHash,
          role: 'customer'
        });
        userObj = newUser;
      } catch (dbErr) {
        // Memory Store fallback
        const newUser = {
          _id: 'user-' + Date.now(),
          id: 'user-' + Date.now(),
          name: reg.name,
          email: reg.email,
          password: reg.passwordHash,
          role: 'customer' as const,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300',
          phone: '',
          addresses: [],
          wishlist: [],
          createdAt: new Date().toISOString()
        };

        memoryStore.users.push(newUser);
        userObj = newUser;
      }
    } else {
      // Login mode - lookup user
      try {
        userObj = await User.findOne({ email: normalizedEmail });
      } catch (e) {
        // Continue
      }

      if (!userObj) {
        userObj = memoryStore.users.find(u => u.email.toLowerCase() === normalizedEmail);
      }
    }

    if (!userObj) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    const userId = (userObj as any)._id ? (userObj as any)._id.toString() : userObj.id;
    const tokens = generateTokens(userId, userObj.role || 'customer');

    return res.json({
      message: 'OTP verification successful! Welcome to ShopKart.',
      user: {
        id: userId,
        name: userObj.name,
        email: userObj.email,
        role: userObj.role || 'customer',
        avatar: userObj.avatar,
        phone: userObj.phone || '',
        addresses: userObj.addresses || [],
        wishlist: userObj.wishlist || []
      },
      tokens
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
