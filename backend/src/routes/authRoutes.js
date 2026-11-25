import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateNameSchema,
  updateEmailSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from '../validators/authValidators.js';

const router = Router();

// Protect credential & authentication endpoints with rate limiting
router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/google', authRateLimiter, validate(googleAuthSchema), authController.google);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Authenticated user profile routes
router.get('/me', requireAuth, authController.me);
router.put('/currency', requireAuth, authController.updateCurrency);
router.put('/name', requireAuth, validate(updateNameSchema), authController.updateName);
router.put('/email', requireAuth, validate(updateEmailSchema), authController.updateEmail);
router.put('/password', requireAuth, validate(changePasswordSchema), authController.changePassword);
router.delete('/account', requireAuth, validate(deleteAccountSchema), authController.deleteAccount);

export default router;
