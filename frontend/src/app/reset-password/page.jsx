'use client';

import { Suspense } from 'react';
import ResetPassword from '../../views/ResetPassword';

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-[1440px] w-full px-6 sm:px-10 py-12 sm:py-16">
      <Suspense
        fallback={
          <div className="mx-auto max-w-sm rounded-lg border border-line bg-white p-8 text-center text-xs text-ink/50">
            Loading reset form…
          </div>
        }
      >
        <ResetPassword />
      </Suspense>
    </main>
  );
}
