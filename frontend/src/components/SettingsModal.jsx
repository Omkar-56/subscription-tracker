'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'email', label: 'Email' },
  { id: 'password', label: 'Password' },
  { id: 'danger', label: 'Delete Account' },
];

export default function SettingsModal({ isOpen, onClose }) {
  const { user, updateTokenAndUser, deleteAccount } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [name, setName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMessage, setNameMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Email form state
  const [newEmail, setNewEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  // Delete account form state
  const [deleteCurrentPassword, setDeleteCurrentPassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setNewEmail('');
      setEmailCurrentPassword('');
      setCurrentPassword('');
      setNextPassword('');
      setConfirmPassword('');
      setDeleteCurrentPassword('');
      setDeleteConfirmText('');
      setNameMessage(null);
      setEmailMessage(null);
      setPasswordMessage(null);
      setDeleteError('');
    }
  }, [isOpen, user]);

  // Handle escape key and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
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
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const hasPassword = user.hasPassword !== false;

  async function handleNameSubmit(e) {
    e.preventDefault();
    setNameMessage(null);
    setNameLoading(true);
    try {
      const res = await api.updateName(name.trim());
      updateTokenAndUser(res.token, res.user);
      setNameMessage({ type: 'success', text: 'Name updated successfully.' });
    } catch (err) {
      setNameMessage({ type: 'error', text: err.message || 'Failed to update name.' });
    } finally {
      setNameLoading(false);
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setEmailMessage(null);
    setEmailLoading(true);
    try {
      const res = await api.updateEmail({
        email: newEmail.trim(),
        currentPassword: emailCurrentPassword || undefined,
      });
      updateTokenAndUser(res.token, res.user);
      setEmailMessage({ type: 'success', text: 'Email address updated successfully.' });
      setNewEmail('');
      setEmailCurrentPassword('');
    } catch (err) {
      setEmailMessage({ type: 'error', text: err.message || 'Failed to update email.' });
    } finally {
      setEmailLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordMessage(null);

    if (nextPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (nextPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.changePassword({
        currentPassword: hasPassword ? currentPassword : undefined,
        newPassword: nextPassword,
      });
      updateTokenAndUser(res.token, res.user);
      setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNextPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleDeleteSubmit(e) {
    e.preventDefault();
    setDeleteError('');

    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion.');
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteAccount({
        currentPassword: hasPassword ? deleteCurrentPassword : undefined,
        confirmation: 'DELETE',
      });
      onClose();
      router.push('/');
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account.');
      setDeleteLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/25 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md rounded-lg border border-line bg-paper p-6 sm:p-7 shadow-xl z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header: Subspens logo and Close (X) button */}
        <div className="flex items-center justify-between pb-3.5 border-b border-line/60">
          <div className="flex items-center gap-2">
            <img
              src="/logo/logo.svg"
              alt="Subspens"
              className="h-6 w-auto object-contain"
            />
            <img
              src="/logo/logo-t.svg"
              alt="Subspens"
              className="h-6 w-auto object-contain"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink/40 hover:text-ink text-xl font-light p-1 rounded hover:bg-line/40 transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Title & User info */}
        <div className="mt-3.5 mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink font-display">Account Settings</h2>
            <p className="text-xs text-ink/55 truncate max-w-[280px]" title={user.email}>
              {user.email}
            </p>
          </div>
        </div>

        {/* Segmented Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-md bg-line/35 border border-line/60 mb-5 text-xs font-medium">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDanger = tab.id === 'danger';
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 px-1 rounded transition-colors text-center truncate cursor-pointer ${
                  isActive
                    ? isDanger
                      ? 'bg-rust text-white shadow-xs font-semibold'
                      : 'bg-ledger text-white shadow-xs font-semibold'
                    : isDanger
                    ? 'text-rust/80 hover:text-rust hover:bg-rust/10'
                    : 'text-ink/65 hover:text-ink hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto pr-1 flex-1">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink/75 mb-1">
                  Full Name / Username
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={100}
                  required
                  className="w-full rounded border border-line bg-white/70 px-3 py-2 text-sm text-ink placeholder:text-ink/35 outline-none focus:border-ledger focus:bg-white transition-colors"
                />
              </div>

              {nameMessage && (
                <div
                  className={`rounded p-2.5 text-xs ${
                    nameMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rust/10 text-rust border border-rust/20'
                  }`}
                >
                  {nameMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={nameLoading || !name.trim()}
                className="w-full rounded bg-ledger py-2 text-xs font-semibold text-white shadow-2xs hover:bg-ledger-dark disabled:opacity-50 transition-colors cursor-pointer"
              >
                {nameLoading ? 'Saving…' : 'Save Name'}
              </button>
            </form>
          )}

          {/* TAB 2: EMAIL */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink/75 mb-1">
                  Current Email
                </label>
                <input
                  type="text"
                  value={user.email}
                  disabled
                  className="w-full rounded border border-line/60 bg-line/20 px-3 py-2 text-sm text-ink/60 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink/75 mb-1">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new@example.com"
                  required
                  className="w-full rounded border border-line bg-white/70 px-3 py-2 text-sm text-ink placeholder:text-ink/35 outline-none focus:border-ledger focus:bg-white transition-colors"
                />
              </div>

              {hasPassword && (
                <div>
                  <label className="block text-xs font-medium text-ink/75 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showEmailPassword ? 'text' : 'password'}
                      value={emailCurrentPassword}
                      onChange={(e) => setEmailCurrentPassword(e.target.value)}
                      placeholder="Confirm with your password"
                      required
                      className="w-full rounded border border-line bg-white/70 pl-3 pr-10 py-2 text-sm text-ink placeholder:text-ink/35 outline-none focus:border-ledger focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmailPassword(!showEmailPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink text-xs cursor-pointer"
                    >
                      {showEmailPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-ink/50">
                    Required to confirm changes to your email address.
                  </p>
                </div>
              )}

              {emailMessage && (
                <div
                  className={`rounded p-2.5 text-xs ${
                    emailMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rust/10 text-rust border border-rust/20'
                  }`}
                >
                  {emailMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={emailLoading || !newEmail.trim() || (hasPassword && !emailCurrentPassword)}
                className="w-full rounded bg-ledger py-2 text-xs font-semibold text-white shadow-2xs hover:bg-ledger-dark disabled:opacity-50 transition-colors cursor-pointer"
              >
                {emailLoading ? 'Updating…' : 'Update Email'}
              </button>
            </form>
          )}

          {/* TAB 3: PASSWORD */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {!hasPassword && (
                <div className="rounded p-2.5 text-xs bg-amber-50 text-amber-800 border border-amber-200">
                  You originally signed in with Google. You can set a password here to enable email/password sign-in as well.
                </div>
              )}

              {hasPassword && (
                <div>
                  <label className="block text-xs font-medium text-ink/75 mb-1">
                    Current Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="w-full rounded border border-line bg-white/70 px-3 py-2 text-sm text-ink placeholder:text-ink/35 outline-none focus:border-ledger focus:bg-white transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-ink/75 mb-1">
                  New Password (minimum 8 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={nextPassword}
                    onChange={(e) => setNextPassword(e.target.value)}
                    placeholder="Enter new password"
                    minLength={8}
                    required
                    className="w-full rounded border border-line bg-white/70 pl-3 pr-10 py-2 text-sm text-ink placeholder:text-ink/35 outline-none focus:border-ledger focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink text-xs cursor-pointer"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink/75 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  minLength={8}
                  required
                  className="w-full rounded border border-line bg-white/70 px-3 py-2 text-sm text-ink placeholder:text-ink/35 outline-none focus:border-ledger focus:bg-white transition-colors"
                />
              </div>

              {passwordMessage && (
                <div
                  className={`rounded p-2.5 text-xs ${
                    passwordMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rust/10 text-rust border border-rust/20'
                  }`}
                >
                  {passwordMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  passwordLoading ||
                  (hasPassword && !currentPassword) ||
                  !nextPassword ||
                  nextPassword.length < 8 ||
                  nextPassword !== confirmPassword
                }
                className="w-full rounded bg-ledger py-2 text-xs font-semibold text-white shadow-2xs hover:bg-ledger-dark disabled:opacity-50 transition-colors cursor-pointer"
              >
                {passwordLoading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          )}

          {/* TAB 4: DANGER ZONE (DELETE ACCOUNT) */}
          {activeTab === 'danger' && (
            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              <div className="rounded border border-rust/30 bg-rust/5 p-3 text-xs text-rust space-y-1.5">
                <p className="font-semibold text-rust">Permanent Deletion</p>
                <p className="text-ink/75 leading-relaxed">
                  Deleting your account will immediately and permanently erase all your data, including tracked subscriptions, payment history, reminders, and user settings. This action cannot be reversed.
                </p>
              </div>

              {hasPassword && (
                <div>
                  <label className="block text-xs font-medium text-ink/75 mb-1">
                    Your Password
                  </label>
                  <input
                    type="password"
                    value={deleteCurrentPassword}
                    onChange={(e) => setDeleteCurrentPassword(e.target.value)}
                    placeholder="Enter your password to verify"
                    required
                    className="w-full rounded border border-line bg-white/70 px-3 py-2 text-sm text-ink placeholder:text-ink/35 outline-none focus:border-rust focus:bg-white transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-ink/75 mb-1">
                  Type <span className="font-bold text-rust">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  required
                  className="w-full rounded border border-line bg-white/70 px-3 py-2 text-sm text-ink placeholder:text-ink/35 outline-none focus:border-rust focus:bg-white transition-colors"
                />
              </div>

              {deleteError && (
                <div className="rounded p-2.5 text-xs bg-rust/10 text-rust border border-rust/20">
                  {deleteError}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  deleteLoading ||
                  deleteConfirmText.trim().toUpperCase() !== 'DELETE' ||
                  (hasPassword && !deleteCurrentPassword)
                }
                className="w-full rounded bg-rust py-2 text-xs font-semibold text-white shadow-2xs hover:bg-rust/90 disabled:opacity-40 transition-colors cursor-pointer"
              >
                {deleteLoading ? 'Deleting Account…' : 'Permanently Delete Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
