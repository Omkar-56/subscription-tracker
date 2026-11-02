'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const router = useRouter();
  const { setAuthModal } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Missing reset token. Please use the link sent to your email.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoToLogin() {
    setAuthModal('login');
    router.push('/login');
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-sm rounded-lg border border-line bg-white p-6 shadow-2xs text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Invalid Reset Link</h1>
          <p className="mt-1.5 text-xs text-ink/70 leading-relaxed">
            No password reset token was provided in the URL. Please verify you clicked the complete link in your email.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="w-full inline-block rounded-sm bg-ledger py-2 text-xs font-semibold text-white hover:bg-ledger-dark transition-colors"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-ink font-medium transition-colors"
        >
          ← Back to Log In
        </Link>
      </div>

      <h1 className="font-display text-2xl font-semibold text-ink">Set new password</h1>
      <p className="mt-1 text-sm text-ink/60">
        Choose a strong password with at least 8 characters.
      </p>

      {success ? (
        <div className="mt-6 rounded-lg border border-line bg-white p-6 shadow-2xs space-y-4 text-center animate-in fade-in">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-ledger">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink">Password updated</h2>
            <p className="mt-1.5 text-xs text-ink/70 leading-relaxed">
              Your password has been changed successfully. You can now sign in using your new credentials.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGoToLogin}
            className="w-full rounded-sm bg-ledger py-2.5 text-xs font-semibold text-white hover:bg-ledger-dark transition-colors cursor-pointer"
          >
            Sign In Now
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-ink">New password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                aria-label="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-sm border border-line bg-white px-3.5 py-2.5 pr-10 text-sm text-ink outline-none transition-colors focus:border-ledger focus:ring-1 focus:ring-ledger placeholder:text-ink/40"
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

          <div>
            <label className="text-sm font-medium text-ink">Confirm new password</label>
            <div className="relative mt-1">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="Re-enter new password"
                aria-label="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-sm border border-line bg-white px-3.5 py-2.5 pr-10 text-sm text-ink outline-none transition-colors focus:border-ledger focus:ring-1 focus:ring-ledger placeholder:text-ink/40"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink/40 hover:text-ink transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
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

          {error && (
            <div className="rounded-sm bg-red-50/80 p-3 border border-red-200/60 text-xs text-rust font-medium space-y-1">
              <p>{error}</p>
              {error.toLowerCase().includes('expired') && (
                <p>
                  <Link href="/forgot-password" className="underline font-semibold text-rust hover:opacity-80">
                    Click here to request a new reset link &rarr;
                  </Link>
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-sm bg-ledger py-2.5 text-sm font-semibold text-white shadow-2xs hover:bg-ledger-dark disabled:opacity-60 transition-colors cursor-pointer"
          >
            {submitting ? 'Updating password…' : 'Reset password'}
          </button>
        </form>
      )}
    </div>
  );
}
