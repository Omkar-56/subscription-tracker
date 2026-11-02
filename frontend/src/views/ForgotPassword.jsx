'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.forgotPassword(email);
      setSubmitted(true);
      setMessage(res.message || 'If an account exists with this email, a reset link has been sent.');
    } catch (err) {
      setError(err.message || 'Failed to request password reset');
    } finally {
      setSubmitting(false);
    }
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

      <h1 className="font-display text-2xl font-semibold text-ink">Forgot password</h1>
      <p className="mt-1 text-sm text-ink/60">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {submitted ? (
        <div className="mt-6 rounded-lg border border-line bg-white p-6 shadow-2xs space-y-4 text-center animate-in fade-in">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-ledger">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink">Check your email</h2>
            <p className="mt-1.5 text-xs text-ink/70 leading-relaxed">
              {message || `We've sent a password reset link to ${email}.`}
            </p>
          </div>
          <p className="text-[11px] text-ink/45">
            Link expires in 1 hour. Be sure to check your spam or junk folder if you don't see it within a couple minutes.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setError('');
              }}
              className="w-full rounded-sm border border-line py-2 text-xs font-semibold text-ink hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Send another link
            </button>
            <Link
              href="/login"
              className="w-full rounded-sm bg-ledger py-2 text-xs font-semibold text-white hover:bg-ledger-dark transition-colors inline-block text-center"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-ink">Email address</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-sm border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ledger focus:ring-1 focus:ring-ledger placeholder:text-ink/40"
            />
          </div>

          {error && <p className="text-sm text-rust font-medium">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-sm bg-ledger py-2.5 text-sm font-semibold text-white shadow-2xs hover:bg-ledger-dark disabled:opacity-60 transition-colors cursor-pointer"
          >
            {submitting ? 'Sending link…' : 'Send reset link'}
          </button>

          <p className="text-center text-xs text-ink/60">
            Remember your password?{' '}
            <Link href="/login" className="text-ledger hover:underline font-medium">
              Log in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
