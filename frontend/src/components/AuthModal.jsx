'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import GoogleSignInButton from './GoogleSignInButton';

export default function AuthModal({ isOpen, initialMode = 'login', onClose }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot'
  const { login, register } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  // Sync mode with initialMode prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'login');
      setError('');
      setName('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setSubmitting(false);
      setForgotSuccess(false);
      setForgotMessage('');
    }
  }, [isOpen, initialMode]);

  // Handle escape key and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      const hasOtherModal = document.querySelector('.fixed.inset-0.z-50');
      if (!hasOtherModal) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  function handleAuthSuccess() {
    onClose();
    // Only navigate to dashboard if currently on the landing page '/'
    // If on /subscriptions, /dashboard, etc., stay on current page so the user continues their workflow
    if (pathname === '/') {
      router.push('/dashboard');
    }
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      handleAuthSuccess();
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(name, email, password);
      handleAuthSuccess();
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.forgotPassword(email);
      setForgotSuccess(true);
      setForgotMessage(res.message || 'If an account exists with this email, a reset link has been sent.');
    } catch (err) {
      setError(err.message || 'Failed to request password reset');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/25 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!submitting) onClose();
        }}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-sm rounded-lg border border-line bg-paper p-6 sm:p-7 shadow-xl z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* 1. SubTrack Logo and Cross (X) Button */}
        <div className="flex items-center justify-between pb-4 border-b border-line/60">
          <div className="flex items-center gap-2">
            <img
              src="/logo/logo.svg"
              alt="SubTrack"
              className="h-6 w-auto object-contain"
            />
            <img
              src="/logo/logo-t.svg"
              alt="SubTrack"
              className="h-6 w-auto object-contain"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-ink/40 hover:text-ink text-xl font-light p-1 rounded hover:bg-line/40 disabled:opacity-40 transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* 2. Navigator: Log In <-> Sign Up (hidden in 'forgot' mode) */}
        {mode !== 'forgot' ? (
          <div className="mt-5 flex rounded-sm border border-line/60 bg-line/30 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 rounded-xs py-1.5 transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-paper text-ink shadow-2xs font-semibold'
                  : 'text-ink/50 hover:text-ink'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 rounded-xs py-1.5 transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-paper text-ink shadow-2xs font-semibold'
                  : 'text-ink/50 hover:text-ink'
              }`}
            >
              Sign Up
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setForgotSuccess(false);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-ink font-medium transition-colors cursor-pointer"
            >
              ← Back to Log In
            </button>
          </div>
        )}

        {/* 3. Header */}
        <div className="mt-4">
          {mode === 'login' ? (
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">Welcome back</h2>
              <p className="mt-1 text-xs sm:text-sm text-ink/60">
                Sign in to see what's renewing.
              </p>
            </div>
          ) : mode === 'register' ? (
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">Create your account</h2>
              <p className="mt-1 text-xs sm:text-sm text-ink/60">
                Start tracking what you pay for, monthly.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">Reset password</h2>
              <p className="mt-1 text-xs sm:text-sm text-ink/60">
                Enter your email address and we'll send you a password reset link.
              </p>
            </div>
          )}
        </div>

        {/* 4. Google Option (only for login and register) */}
        {mode !== 'forgot' && (
          <>
            <div className="mt-5">
              <GoogleSignInButton
                text={mode === 'login' ? 'signin_with' : 'signup_with'}
                onSuccess={handleAuthSuccess}
                onError={(err) => setError(err)}
              />
            </div>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-line/70" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-paper px-2.5 text-ink/50 font-medium">Or continue with email</span>
              </div>
            </div>
          </>
        )}

        {/* 5. Forms */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <input
                type="email"
                required
                placeholder="Email address"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-sm border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-ledger focus:ring-1 focus:ring-ledger"
              />
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
                  aria-label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-sm border border-line bg-white px-3.5 py-2.5 pr-10 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-ledger focus:ring-1 focus:ring-ledger"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink/40 hover:text-ink transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Forgot password button shifted below password input */}
              <div className="mt-1.5 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError('');
                  }}
                  className="text-xs text-ledger hover:underline font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-rust font-medium">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-sm bg-ledger py-2.5 text-sm font-semibold text-white shadow-2xs hover:bg-ledger-dark disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : mode === 'register' ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <input
                type="text"
                required
                placeholder="Your full name"
                aria-label="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-sm border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-ledger focus:ring-1 focus:ring-ledger"
              />
            </div>

            <div>
              <input
                type="email"
                required
                placeholder="Email address"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-sm border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-ledger focus:ring-1 focus:ring-ledger"
              />
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Password (min. 8 characters)"
                  aria-label="Password (min. 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-sm border border-line bg-white px-3.5 py-2.5 pr-10 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-ledger focus:ring-1 focus:ring-ledger"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink/40 hover:text-ink transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-rust font-medium">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-sm bg-ledger py-2.5 text-sm font-semibold text-white shadow-2xs hover:bg-ledger-dark disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        ) : (
          /* Forgot Password Mode */
          <div className="mt-4">
            {forgotSuccess ? (
              <div className="space-y-4 text-center py-2 animate-in fade-in">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-ledger">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-ink">Check your email</h3>
                  <p className="text-xs text-ink/65 leading-relaxed">
                    {forgotMessage || `We sent a password reset link to ${email}.`}
                  </p>
                </div>
                <p className="text-[11px] text-ink/45">
                  Didn't receive an email? Check your spam folder or try again in a few minutes.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setForgotSuccess(false);
                  }}
                  className="w-full rounded-sm bg-stone-100 py-2.5 text-xs font-semibold text-ink hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  Return to Log In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3.5">
                <div>
                  <input
                    type="email"
                    required
                    placeholder="Enter your account email"
                    aria-label="Enter your account email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-sm border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-ledger focus:ring-1 focus:ring-ledger"
                  />
                </div>

                {error && <p className="text-xs text-rust font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-sm bg-ledger py-2.5 text-sm font-semibold text-white shadow-2xs hover:bg-ledger-dark disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting ? 'Sending link…' : 'Send reset link'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
