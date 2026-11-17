import { Router } from 'express';
import { subscriptionController } from '../controllers/subscriptionController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import {
  subscriptionSchema,
  parseReceiptSchema,
  confirmPaymentSchema,
  convertTrialSchema,
} from '../validators/subscriptionValidators.js';

const router = Router();

router.use(requireAuth);

// Collection routes
router.get('/', subscriptionController.list);
router.post('/', validate(subscriptionSchema), subscriptionController.create);
router.post('/parse-receipt', aiRateLimiter, validate(parseReceiptSchema), subscriptionController.parseReceipt);
router.get('/payments/recent', subscriptionController.getAllPayments);

// Individual item routes
router.get('/:id', subscriptionController.get);
router.get('/:id/price-history', subscriptionController.priceHistory);
router.get('/:id/payments', subscriptionController.getPayments);
router.post('/:id/advance', subscriptionController.advance);
router.post('/:id/confirm-payment', validate(confirmPaymentSchema), subscriptionController.confirmPayment);
router.post('/:id/convert-trial', validate(convertTrialSchema), subscriptionController.convertTrial);
router.put('/:id', validate(subscriptionSchema), subscriptionController.update);
router.delete('/:id', subscriptionController.delete);

export default router;
