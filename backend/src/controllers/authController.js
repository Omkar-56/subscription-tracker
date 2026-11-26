import { authService } from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { user, token } = await authService.register(req.body);
    res.status(201).json({ user, token });
  }),

  login: asyncHandler(async (req, res) => {
    const { user, token } = await authService.login(req.body);
    res.json({ user, token });
  }),

  google: asyncHandler(async (req, res) => {
    const { credential } = req.body;
    const { user, token } = await authService.googleAuth(credential);
    res.json({ user, token });
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const origin = req.get('origin') || (req.get('referer') ? new URL(req.get('referer')).origin : null);
    const result = await authService.forgotPassword(req.body.email, origin);
    res.json(result);
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.body);
    res.json(result);
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authService.me(req.user.id);
    res.json({ user });
  }),

  updateCurrency: asyncHandler(async (req, res) => {
    const user = await authService.updateCurrency(req.user.id, req.body.currency);
    res.json({ user });
  }),

  updateName: asyncHandler(async (req, res) => {
    const result = await authService.updateName(req.user.id, req.body.name);
    res.json(result);
  }),

  updateEmail: asyncHandler(async (req, res) => {
    const result = await authService.updateEmail(req.user.id, req.body.email, req.body.currentPassword);
    res.json(result);
  }),

  changePassword: asyncHandler(async (req, res) => {
    const result = await authService.changePassword(req.user.id, req.body);
    res.json(result);
  }),

  deleteAccount: asyncHandler(async (req, res) => {
    const result = await authService.deleteAccount(req.user.id, req.body);
    res.json(result);
  }),
};
