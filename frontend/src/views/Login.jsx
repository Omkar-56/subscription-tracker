'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);

      const pending = typeof window !== 'undefined' ? sessionStorage.getItem('subtrack_pending_subscription') : null;
      if (pending) {
        try {
          await api.createSubscription(JSON.parse(pending));
          sessionStorage.removeItem('subtrack_pending_subscription');
        } catch (subErr) {
          console.error('Failed to auto-create pending subscription:', subErr);
        }
      }

      router.push('/subscriptions');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      {/* Mode switcher tabs */}
      <div className="flex rounded-sm bg-stone-100 p-1 mb-6 text-xs font-semibold">
        <button
          type="button"
          className="flex-1 rounded-xs py-1.5 bg-white text-ink shadow-2xs text-center cursor-default"
        >
          Log In
        </button>
        <Link
          href="/register"
          className="flex-1 rounded-xs py-1.5 text-ink/50 hover:text-ink text-center transition-colors"
        >
          Sign Up
        </Link>
      </div>

      <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-ink/60">Sign in to see what's renewing.</p>

      {/* Google OAuth Button */}
      <div className="mt-6">
        <GoogleSignInButton text="signin_with" onError={(err) => setError(err)} />
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-paper px-2 text-ink/40 font-medium">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            required
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-sm border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ledger focus:ring-1 focus:ring-ledger"
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
              className="w-full rounded-sm border border-line bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-ledger focus:ring-1 focus:ring-ledger placeholder:text-ink/40"
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
          <div className="mt-1.5 flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-ledger hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
        </div>
        {error && <p className="text-sm text-rust">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-sm bg-ledger py-2 text-sm font-medium text-white transition-colors hover:bg-ledger-dark disabled:opacity-60 cursor-pointer"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink/60">
        New here? <Link href="/register" className="text-ledger hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
