import { subscriptionService } from '../services/subscriptionService.js';
import { geminiService } from '../services/geminiService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const subscriptionController = {
  list: asyncHandler(async (req, res) => {
    const subscriptions = await subscriptionService.list(req.user.id);
    res.json({ subscriptions });
  }),

  create: asyncHandler(async (req, res) => {
    const subscription = await subscriptionService.create(req.user.id, {
      ...req.body,
      status: req.body.status || 'active',
    });
    res.status(201).json({ subscription });
  }),

  parseReceipt: asyncHandler(async (req, res) => {
    const { text, fileBase64, mimeType } = req.body;
    const defaultCurrency = req.user.baseCurrency || 'INR';

    // 1. Ask Gemini to extract structured subscriptions
    const extracted = await geminiService.parseReceiptOrDoc({
      text,
      fileBase64,
      mimeType,
      defaultCurrency,
    });

    // 2. Automatically create each subscription in the user's account
    const createdSubscriptions = [];
    for (const item of extracted) {
      const created = await subscriptionService.create(req.user.id, {
        name: item.name,
        category: item.category,
        amount: item.amount,
        currency: item.currency,
        billingCycle: item.billingCycle,
        nextRenewalDate: item.nextRenewalDate,
        notes: item.notes,
        isFreeTrial: item.isFreeTrial,
        trialEndDate: item.trialEndDate,
        cancellationDeadline: item.cancellationDeadline,
        postTrialAmount: item.postTrialAmount,
        postTrialCurrency: item.postTrialCurrency,
        status: 'active',
      });
      createdSubscriptions.push(created);
    }

    res.status(201).json({
      subscriptions: createdSubscriptions,
      count: createdSubscriptions.length,
      parsedItems: extracted,
    });
  }),

  get: asyncHandler(async (req, res) => {
    const subscription = await subscriptionService.get(req.user.id, req.params.id);
    res.json({ subscription });
  }),

  update: asyncHandler(async (req, res) => {
    const subscription = await subscriptionService.update(req.user.id, req.params.id, {
      ...req.body,
      status: req.body.status || 'active',
    });
    res.json({ subscription });
  }),

  convertTrial: asyncHandler(async (req, res) => {
    const { nextRenewalDate } = req.body || {};
    const subscription = await subscriptionService.convertTrial(req.user.id, req.params.id, nextRenewalDate);
    res.json({ subscription });
  }),

  advance: asyncHandler(async (req, res) => {
    const subscription = await subscriptionService.advanceCycle(req.user.id, req.params.id);
    res.json({ subscription });
  }),

  confirmPayment: asyncHandler(async (req, res) => {
    const result = await subscriptionService.confirmPayment(req.user.id, req.params.id, req.body);
    res.json(result);
  }),

  getPayments: asyncHandler(async (req, res) => {
    const payments = await subscriptionService.getPayments(req.user.id, req.params.id);
    res.json({ payments });
  }),

  getAllPayments: asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit) || 50;
    const payments = await subscriptionService.getAllPayments(req.user.id, limit);
    res.json({ payments });
  }),

  priceHistory: asyncHandler(async (req, res) => {
    const history = await subscriptionService.priceHistory(req.user.id, req.params.id);
    res.json({ history });
  }),

  delete: asyncHandler(async (req, res) => {
    await subscriptionService.delete(req.user.id, req.params.id);
    res.status(204).send();
  }),
};
