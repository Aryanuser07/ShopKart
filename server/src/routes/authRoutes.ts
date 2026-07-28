import { Router } from 'express';
import { registerUser, loginUser, requestSignupOTP, sendOTP, verifyOTP, getProfile, updateProfile, toggleWishlist } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validateSignupInput, validateLoginInput, validateSendOtpInput, validateVerifyOtpInput } from '../middleware/validationMiddleware';

const router = Router();

router.post('/register', validateSignupInput, registerUser);
router.post('/register-otp', validateSignupInput, requestSignupOTP);
router.post('/login', validateLoginInput, loginUser);
router.post('/send-otp', validateSendOtpInput, sendOTP);
router.post('/verify-otp', validateVerifyOtpInput, verifyOTP);
router.get('/me', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/wishlist/toggle', protect, toggleWishlist);

export default router;
