'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);

      const pending = typeof window !== 'undefined'
        ? sessionStorage.getItem('subspens_pending_subscription') || sessionStorage.getItem('subtrack_pending_subscription')
        : null;
      if (pending) {
        try {
          await api.createSubscription(JSON.parse(pending));
          sessionStorage.removeItem('subspens_pending_subscription');
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
      <div className="card space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Welcome back</h1>
          <p className="mt-1 text-sm text-neutral-500">Sign in to your account</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <GoogleSignInButton
          onSuccess={async () => {
            const pending = typeof window !== 'undefined'
              ? sessionStorage.getItem('subspens_pending_subscription') || sessionStorage.getItem('subtrack_pending_subscription')
              : null;
            if (pending) {
              try {
                await api.createSubscription(JSON.parse(pending));
                sessionStorage.removeItem('subspens_pending_subscription');
                sessionStorage.removeItem('subtrack_pending_subscription');
              } catch (subErr) {
                console.error('Failed to auto-create pending subscription:', subErr);
              }
            }
            router.push('/subscriptions');
          }}
          onError={(err) => setError(err.message || 'Google sign-in failed')}
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-neutral-400">or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="label" htmlFor="password">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-neutral-500 hover:text-neutral-900"
              >
                Forgot?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-neutral-500">
          No account yet?{' '}
          <Link href="/register" className="font-medium text-neutral-900 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
