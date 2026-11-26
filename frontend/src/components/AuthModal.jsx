'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import GoogleSignInButton from './GoogleSignInButton';
import AuthBlobCompanion from './AuthBlobCompanion';
import RadialFillButton from './RadialFillButton';

export default function AuthModal({ isOpen, initialMode = 'login', onClose }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot'
  const { login, register } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const modalCardRef = useRef(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  // Mascot companion tracking states
  const [focusedField, setFocusedField] = useState(null); // null | 'name' | 'email' | 'password'
  const [activeInputEl, setActiveInputEl] = useState(null);
  const [hoverTarget, setHoverTarget] = useState(null); // null | 'close' | 'google' | 'submit'

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
      setFocusedField(null);
      setActiveInputEl(null);
      setHoverTarget(null);
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

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
    setForgotSuccess(false);
    setFocusedField(null);
    setActiveInputEl(null);
    setHoverTarget(null);
  }

  function handleFieldFocus(field) {
    return (e) => {
      setFocusedField(field);
      setActiveInputEl(e.currentTarget);
    };
  }

  function handleFieldBlur(field) {
    return () => {
      setFocusedField((prev) => (prev === field ? null : prev));
    };
  }

  const activeTextLength =
    focusedField === 'name'
      ? name.length
      : focusedField === 'email'
        ? email.length
        : 0;

  const passwordVisibilityButton = (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
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
  );

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
      <div
        ref={modalCardRef}
        className="relative w-full max-w-sm sm:max-w-[620px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl squircle border border-line bg-paper p-5 sm:p-7 shadow-xl z-10"
      >
        {/* 1. Header Text + Close (X) Button */}
        <div className="flex items-start justify-between gap-3">
          <div>
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

          <button
            type="button"
            onClick={onClose}
            onMouseEnter={() => setHoverTarget('close')}
            onMouseLeave={() => setHoverTarget((prev) => (prev === 'close' ? null : prev))}
            disabled={submitting}
            className="shrink-0 -mt-1 -mr-1 text-ink/40 hover:text-ink text-xl font-light p-1 rounded-lg squircle hover:bg-line/40 disabled:opacity-40 transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* 2. Navigator: Log In <-> Sign Up (or Back link in 'forgot' mode) */}
        {mode !== 'forgot' ? (
          <div className="mt-4 relative flex rounded-xl squircle border border-line/60 bg-line/30 p-1 text-xs font-semibold">
            {/* Sliding pill indicator */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg squircle bg-ledger/10 shadow-2xs transition-transform duration-300 ease-in-out ${
                mode === 'register' ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'
              }`}
            />
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`relative flex-1 rounded-lg squircle py-1.5 transition-colors duration-300 cursor-pointer ${
                mode === 'login' ? 'text-ink font-semibold' : 'text-ink/50 hover:text-ink'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`relative flex-1 rounded-lg squircle py-1.5 transition-colors duration-300 cursor-pointer ${
                mode === 'register' ? 'text-ink font-semibold' : 'text-ink/50 hover:text-ink'
              }`}
            >
              Sign Up
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-ink font-medium transition-colors cursor-pointer"
            >
              ← Back to Log In
            </button>
          </div>
        )}

        {/* Companion Mascot + Form Body */}
        <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row sm:items-stretch gap-4 sm:gap-6">
          <AuthBlobCompanion
            isOpen={isOpen}
            modalRef={modalCardRef}
            mode={mode}
            focusedField={focusedField}
            activeInputEl={activeInputEl}
            activeTextLength={activeTextLength}
            showPassword={showPassword}
            error={error}
            submitting={submitting}
            forgotSuccess={forgotSuccess}
            hoverTarget={hoverTarget}
          />

          <div className="flex-1 min-w-0">
            {/* 3. Google Option (only for login and register) */}
            {mode !== 'forgot' && (
              <>
                <div
                  onMouseEnter={() => setHoverTarget('google')}
                  onMouseLeave={() => setHoverTarget((prev) => (prev === 'google' ? null : prev))}
                >
                  <GoogleSignInButton
                    text={mode === 'login' ? 'signin_with' : 'signup_with'}
                    onSuccess={handleAuthSuccess}
                    onError={(err) => setError(err)}
                  />
                </div>

                {/* Divider */}
                <div className="relative my-4 sm:my-5">
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
                    onFocus={handleFieldFocus('email')}
                    onBlur={handleFieldBlur('email')}
                    className="w-full rounded-xl squircle border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-ledger focus:ring-1 focus:ring-ledger"
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
                      onFocus={handleFieldFocus('password')}
                      onBlur={handleFieldBlur('password')}
                      className="w-full rounded-xl squircle border border-line bg-white px-3.5 py-2.5 pr-10 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-ledger focus:ring-1 focus:ring-ledger"
                    />
                    {passwordVisibilityButton}
                  </div>

                  {/* Forgot password button shifted below password input */}
                  <div className="mt-1.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-ledger hover:underline font-medium cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs text-rust font-medium">{error}</p>}

                <RadialFillButton
                  type="submit"
                  disabled={submitting}
                  onMouseEnter={() => setHoverTarget('submit')}
                  onMouseLeave={() => setHoverTarget((prev) => (prev === 'submit' ? null : prev))}
                  fillClassName="bg-ledger-dark"
                  className="w-full rounded-xl squircle bg-ledger py-2.5 text-sm font-semibold text-white shadow-2xs disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Signing in…' : 'Sign in'}
                </RadialFillButton>
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
                    onFocus={handleFieldFocus('name')}
                    onBlur={handleFieldBlur('name')}
                    className="w-full rounded-xl squircle border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-ledger focus:ring-1 focus:ring-ledger"
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
                    onFocus={handleFieldFocus('email')}
                    onBlur={handleFieldBlur('email')}
                    className="w-full rounded-xl squircle border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-ledger focus:ring-1 focus:ring-ledger"
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
                      onFocus={handleFieldFocus('password')}
                      onBlur={handleFieldBlur('password')}
                      className="w-full rounded-xl squircle border border-line bg-white px-3.5 py-2.5 pr-10 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-ledger focus:ring-1 focus:ring-ledger"
                    />
                    {passwordVisibilityButton}
                  </div>
                </div>

                {error && <p className="text-xs text-rust font-medium">{error}</p>}

                <RadialFillButton
                  type="submit"
                  disabled={submitting}
                  onMouseEnter={() => setHoverTarget('submit')}
                  onMouseLeave={() => setHoverTarget((prev) => (prev === 'submit' ? null : prev))}
                  fillClassName="bg-ledger-dark"
                  className="w-full rounded-xl squircle bg-ledger py-2.5 text-sm font-semibold text-white shadow-2xs disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Creating account…' : 'Create account'}
                </RadialFillButton>
              </form>
            ) : (
              /* Forgot Password Mode */
              <div className="mt-4">
                {forgotSuccess ? (
                  <div className="space-y-4 text-center py-2">
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
                    <RadialFillButton
                      onClick={() => switchMode('login')}
                      fillClassName="bg-ledger-light"
                      className="w-full rounded-xl squircle bg-stone-100 py-2.5 text-xs font-semibold text-ink transition-colors duration-300 hover:text-ledger-dark cursor-pointer"
                    >
                      Return to Log In
                    </RadialFillButton>
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
                        onFocus={handleFieldFocus('email')}
                        onBlur={handleFieldBlur('email')}
                        className="w-full rounded-xl squircle border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-ledger focus:ring-1 focus:ring-ledger"
                      />
                    </div>

                    {error && <p className="text-xs text-rust font-medium">{error}</p>}

                    <RadialFillButton
                      type="submit"
                      disabled={submitting}
                      onMouseEnter={() => setHoverTarget('submit')}
                      onMouseLeave={() => setHoverTarget((prev) => (prev === 'submit' ? null : prev))}
                      fillClassName="bg-ledger-dark"
                      className="w-full rounded-xl squircle bg-ledger py-2.5 text-sm font-semibold text-white shadow-2xs disabled:opacity-60 cursor-pointer"
                    >
                      {submitting ? 'Sending link…' : 'Send reset link'}
                    </RadialFillButton>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
