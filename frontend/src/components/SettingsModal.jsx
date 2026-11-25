'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  LuUser,
  LuShieldCheck,
  LuCoins,
  LuTrash2,
  LuX,
  LuCheck,
  LuTriangleAlert,
  LuEye,
  LuEyeOff,
  LuKeyRound,
  LuMail,
  LuLogOut,
} from 'react-icons/lu';

const CURRENCIES = [
  { code: 'INR', label: '₹ INR - Indian Rupee', symbol: '₹' },
  { code: 'USD', label: '$ USD - US Dollar', symbol: '$' },
  { code: 'EUR', label: '€ EUR - Euro', symbol: '€' },
  { code: 'CAD', label: 'CA$ CAD - Canadian Dollar', symbol: 'CA$' },
  { code: 'AED', label: 'AED AED - UAE Dirham', symbol: 'AED' },
  { code: 'JPY', label: '¥ JPY - Japanese Yen', symbol: '¥' },
  { code: 'SGD', label: 'SG$ SGD - Singapore Dollar', symbol: 'SG$' },
  { code: 'AUD', label: 'A$ AUD - Australian Dollar', symbol: 'A$' },
];

const SECTIONS = [
  { id: 'account', label: 'Account', icon: LuUser, description: 'Personal info and email address' },
  { id: 'security', label: 'Security', icon: LuShieldCheck, description: 'Password and sign-in protection' },
  { id: 'preferences', label: 'Preferences', icon: LuCoins, description: 'Default display currency and formatting' },
  { id: 'danger', label: 'Danger Zone', icon: LuTrash2, description: 'Permanently delete account and data' },
];

export default function SettingsModal({ isOpen, onClose }) {
  const {
    user,
    baseCurrency,
    setBaseCurrency,
    updateTokenAndUser,
    deleteAccount,
    logout,
  } = useAuth();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState('account');

  // Account - Name
  const [name, setName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMessage, setNameMessage] = useState(null);

  // Account - Email
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState(null);

  // Security - Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  // Danger Zone - Account Deletion
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Reset states on open
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setNewEmail('');
      setEmailPassword('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setDeletePassword('');
      setDeleteConfirmation('');
      setNameMessage(null);
      setEmailMessage(null);
      setPasswordMessage(null);
      setDeleteError('');
    }
  }, [isOpen, user]);

  // Body scroll lock & Escape key
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
      const otherModal = document.querySelector('.fixed.inset-0.z-50');
      if (!otherModal) {
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
      setNameMessage({ type: 'success', text: 'Display name updated successfully.' });
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
        currentPassword: emailPassword || undefined,
      });
      updateTokenAndUser(res.token, res.user);
      setEmailMessage({ type: 'success', text: 'Email address updated successfully.' });
      setNewEmail('');
      setEmailPassword('');
    } catch (err) {
      setEmailMessage({ type: 'error', text: err.message || 'Failed to update email.' });
    } finally {
      setEmailLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword({
        currentPassword: hasPassword ? currentPassword : undefined,
        newPassword,
      });
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    setDeleteError('');

    if (deleteConfirmation.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.');
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteAccount({
        currentPassword: hasPassword ? deletePassword : undefined,
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/30 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Big Card with Squircle Edges */}
      <div className="relative w-full max-w-4xl h-[620px] max-h-[90vh] rounded-[28px] sm:rounded-3xl border border-line bg-paper shadow-2xl z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4.5 border-b border-line/70 bg-paper/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
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
            <span className="text-ink/30 font-light">|</span>
            <h1 className="font-display font-medium text-lg text-ink">Settings</h1>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 hover:text-ink hover:bg-line/40 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Left Sidebar + Right Settings List */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: Settings Categories List */}
          <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-line/70 bg-paper/40 p-3 sm:p-4 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              const isDanger = sec.id === 'danger';

              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap text-left w-full ${
                    isActive
                      ? isDanger
                        ? 'bg-rust text-white shadow-xs'
                        : 'bg-ledger text-white shadow-xs'
                      : isDanger
                      ? 'text-rust/80 hover:text-rust hover:bg-rust/10'
                      : 'text-ink/70 hover:text-ink hover:bg-line/40'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : ''}`} />
                  <span className="truncate">{sec.label}</span>
                </button>
              );
            })}

            <div className="hidden md:block mt-auto pt-4 border-t border-line/50">
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-medium text-ink/60 hover:text-rust hover:bg-rust/10 transition-colors cursor-pointer w-full text-left"
              >
                <LuLogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </aside>

          {/* Right Main Content Area: List of Settings Options */}
          <main className="flex-1 p-5 sm:p-8 overflow-y-auto">
            {/* SECTION 1: ACCOUNT */}
            {activeSection === 'account' && (
              <div className="max-w-xl space-y-6">
                <div>
                  <h2 className="font-display font-medium text-xl text-ink">Account Profile</h2>
                  <p className="text-xs text-ink/60 mt-0.5">Manage your personal information and contact email.</p>
                </div>

                {/* Profile Photo / Avatar Row */}
                <div className="rounded-2xl border border-line bg-card p-4.5 sm:p-5 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-ink">Profile Avatar</h3>
                    <p className="text-xs text-ink/50 mt-0.5">Assigned from your account profile or initials.</p>
                  </div>
                  <div className="shrink-0">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name || 'User'}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-line"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-2xl bg-ledger-light text-ledger font-display font-semibold text-lg flex items-center justify-center">
                        {(user.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Full Name / Username Option */}
                <form onSubmit={handleNameSubmit} className="rounded-2xl border border-line bg-card p-4.5 sm:p-5 space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-ink/60 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      maxLength={100}
                      required
                      className="w-full rounded-xl border border-line bg-paper/40 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ledger focus:bg-white transition-colors"
                    />
                  </div>

                  {nameMessage && (
                    <div
                      className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
                        nameMessage.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rust/10 text-rust border border-rust/20'
                      }`}
                    >
                      {nameMessage.type === 'success' ? <LuCheck className="h-4 w-4 shrink-0" /> : <LuTriangleAlert className="h-4 w-4 shrink-0" />}
                      <span>{nameMessage.text}</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={nameLoading || !name.trim()}
                      className="rounded-xl bg-ledger px-5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-ledger-dark disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {nameLoading ? 'Saving…' : 'Save Name'}
                    </button>
                  </div>
                </form>

                {/* Email Address Option */}
                <form onSubmit={handleEmailSubmit} className="rounded-2xl border border-line bg-card p-4.5 sm:p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-ink">Email Address</h3>
                    <p className="text-xs text-ink/50 mt-0.5">Used for notifications, renewals, and signing in.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="block text-xs font-medium text-ink/60 mb-1">Current Email</span>
                      <div className="rounded-xl border border-line/60 bg-line/20 px-3.5 py-2 text-sm text-ink/60 flex items-center gap-2">
                        <LuMail className="h-4 w-4 text-ink/40" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ink/75 mb-1">New Email Address</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="new@example.com"
                        required
                        className="w-full rounded-xl border border-line bg-paper/40 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ledger focus:bg-white transition-colors"
                      />
                    </div>

                    {hasPassword && (
                      <div>
                        <label className="block text-xs font-medium text-ink/75 mb-1">Confirm with Password</label>
                        <div className="relative">
                          <input
                            type={showEmailPassword ? 'text' : 'password'}
                            value={emailPassword}
                            onChange={(e) => setEmailPassword(e.target.value)}
                            placeholder="Enter current password"
                            required
                            className="w-full rounded-xl border border-line bg-paper/40 pl-3.5 pr-10 py-2.5 text-sm text-ink outline-none focus:border-ledger focus:bg-white transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEmailPassword(!showEmailPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink text-xs cursor-pointer"
                          >
                            {showEmailPassword ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {emailMessage && (
                    <div
                      className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
                        emailMessage.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rust/10 text-rust border border-rust/20'
                      }`}
                    >
                      {emailMessage.type === 'success' ? <LuCheck className="h-4 w-4 shrink-0" /> : <LuTriangleAlert className="h-4 w-4 shrink-0" />}
                      <span>{emailMessage.text}</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={emailLoading || !newEmail.trim() || (hasPassword && !emailPassword)}
                      className="rounded-xl bg-ledger px-5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-ledger-dark disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {emailLoading ? 'Updating…' : 'Update Email'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SECTION 2: SECURITY */}
            {activeSection === 'security' && (
              <div className="max-w-xl space-y-6">
                <div>
                  <h2 className="font-display font-medium text-xl text-ink">Security & Authentication</h2>
                  <p className="text-xs text-ink/60 mt-0.5">Control how you access your Subspens account.</p>
                </div>

                {/* Sign-in Method Info */}
                <div className="rounded-2xl border border-line bg-card p-4.5 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-ledger-light text-ledger flex items-center justify-center shrink-0">
                      <LuKeyRound className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-ink">Sign-in Method</h3>
                      <p className="text-xs text-ink/50 mt-0.5">
                        {user.googleId ? 'Google Account Connected' : 'Email and Password'}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                    Active
                  </span>
                </div>

                {/* Password Change Form */}
                <form onSubmit={handlePasswordSubmit} className="rounded-2xl border border-line bg-card p-4.5 sm:p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-ink">
                      {hasPassword ? 'Change Password' : 'Set Account Password'}
                    </h3>
                    <p className="text-xs text-ink/50 mt-0.5">
                      Ensure your password uses at least 8 characters.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {hasPassword && (
                      <div>
                        <label className="block text-xs font-medium text-ink/75 mb-1">Current Password</label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            required
                            className="w-full rounded-xl border border-line bg-paper/40 pl-3.5 pr-10 py-2.5 text-sm text-ink outline-none focus:border-ledger focus:bg-white transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink text-xs cursor-pointer"
                          >
                            {showCurrentPassword ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-ink/75 mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          minLength={8}
                          required
                          className="w-full rounded-xl border border-line bg-paper/40 pl-3.5 pr-10 py-2.5 text-sm text-ink outline-none focus:border-ledger focus:bg-white transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink text-xs cursor-pointer"
                        >
                          {showNewPassword ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ink/75 mb-1">Confirm New Password</label>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        minLength={8}
                        required
                        className="w-full rounded-xl border border-line bg-paper/40 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ledger focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {passwordMessage && (
                    <div
                      className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
                        passwordMessage.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rust/10 text-rust border border-rust/20'
                      }`}
                    >
                      {passwordMessage.type === 'success' ? <LuCheck className="h-4 w-4 shrink-0" /> : <LuTriangleAlert className="h-4 w-4 shrink-0" />}
                      <span>{passwordMessage.text}</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={
                        passwordLoading ||
                        (hasPassword && !currentPassword) ||
                        !newPassword ||
                        newPassword.length < 8 ||
                        newPassword !== confirmPassword
                      }
                      className="rounded-xl bg-ledger px-5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-ledger-dark disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {passwordLoading ? 'Updating…' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SECTION 3: PREFERENCES */}
            {activeSection === 'preferences' && (
              <div className="max-w-xl space-y-6">
                <div>
                  <h2 className="font-display font-medium text-xl text-ink">Preferences</h2>
                  <p className="text-xs text-ink/60 mt-0.5">Customize your regional display and calculation settings.</p>
                </div>

                {/* Base Currency Option */}
                <div className="rounded-2xl border border-line bg-card p-4.5 sm:p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-ink">Default Currency</h3>
                    <p className="text-xs text-ink/50 mt-0.5">
                      All subscriptions and spending analytics will be automatically converted to this currency.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {CURRENCIES.map((c) => {
                      const isSelected = (user.baseCurrency || baseCurrency || 'INR') === c.code;
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => setBaseCurrency(c.code)}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'border-ledger bg-ledger/5 text-ink font-semibold ring-1 ring-ledger'
                              : 'border-line bg-paper/30 text-ink/80 hover:border-ledger/40 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-line/60 text-xs font-bold text-ink shrink-0">
                              {c.symbol}
                            </span>
                            <span className="text-xs truncate">{c.label}</span>
                          </div>
                          {isSelected && <LuCheck className="h-4 w-4 text-ledger shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: DANGER ZONE */}
            {activeSection === 'danger' && (
              <div className="max-w-xl space-y-6">
                <div>
                  <h2 className="font-display font-medium text-xl text-rust">Danger Zone</h2>
                  <p className="text-xs text-ink/60 mt-0.5">Permanent account actions that cannot be reversed.</p>
                </div>

                <form onSubmit={handleDeleteAccount} className="rounded-2xl border border-rust/30 bg-rust/5 p-5 sm:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-rust/10 text-rust flex items-center justify-center shrink-0">
                      <LuTriangleAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-rust">Delete Account & Wipe Data</h3>
                      <p className="text-xs text-ink/75 mt-1 leading-relaxed">
                        Permanently deletes your Subspens account, tracked subscriptions, reminder history, and payment records. All data will be removed immediately.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {hasPassword && (
                      <div>
                        <label className="block text-xs font-medium text-ink/75 mb-1">
                          Confirm with your password
                        </label>
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Your current password"
                          required
                          className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-rust transition-colors"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-ink/75 mb-1">
                        Type <span className="font-bold text-rust">DELETE</span> to confirm
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="DELETE"
                        required
                        className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-rust transition-colors"
                      />
                    </div>
                  </div>

                  {deleteError && (
                    <div className="rounded-xl p-3 text-xs bg-rust/15 text-rust border border-rust/20 flex items-center gap-2">
                      <LuTriangleAlert className="h-4 w-4 shrink-0" />
                      <span>{deleteError}</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={
                        deleteLoading ||
                        deleteConfirmation.trim().toUpperCase() !== 'DELETE' ||
                        (hasPassword && !deletePassword)
                      }
                      className="rounded-xl bg-rust px-5 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-rust/90 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      {deleteLoading ? 'Deleting Account…' : 'Permanently Delete Account'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
