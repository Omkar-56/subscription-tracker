'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useMotionValue } from 'motion/react';
import { JellyBlobMascot, BlobSpeech } from 'feral-blob';
import 'feral-blob/blob.css';

const IDLE_SLEEP_MS = 14000;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Interactive JellyBlobMascot companion for the auth modal.
 * Tracks focused form inputs, peeks away during password entry,
 * follows cursor gaze while idle, naps after inactivity, and reacts to pokes.
 */
export default function AuthBlobCompanion({
  isOpen,
  modalRef,
  mode,
  focusedField,
  activeInputEl,
  activeTextLength = 0,
  showPassword = false,
  error = '',
  submitting = false,
  forgotSuccess = false,
  hoverTarget = null,
}) {
  const blobRef = useRef(null);
  const gazeX = useMotionValue(0);
  const gazeY = useMotionValue(0);
  const gaze = useMemo(() => ({ x: gazeX, y: gazeY, intensity: 1 }), [gazeX, gazeY]);

  const [greeting, setGreeting] = useState(true);
  const [isSleepy, setIsSleepy] = useState(false);
  const [wokeMood, setWokeMood] = useState(false);
  const [overpokeMood, setOverpokeMood] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const [errorAck, setErrorAck] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const sleepTimerRef = useRef(null);
  const wakeTimerRef = useRef(null);
  const overpokeTimerRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isSleepyRef = useRef(false);
  isSleepyRef.current = isSleepy;

  // Track viewport breakpoint so BlobSpeech only mounts and measures when visible (sm+)
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(min-width: 640px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const scheduleSleep = useCallback(() => {
    clearTimeout(sleepTimerRef.current);
    sleepTimerRef.current = setTimeout(() => {
      setIsSleepy(true);
    }, IDLE_SLEEP_MS);
  }, []);

  // Greet briefly on modal open and reset transient states
  useEffect(() => {
    if (!isOpen) return undefined;

    setGreeting(true);
    setIsSleepy(false);
    setWokeMood(false);
    setOverpokeMood(false);
    setIsTyping(false);

    const greetTimer = setTimeout(() => setGreeting(false), 2000);
    scheduleSleep();

    return () => {
      clearTimeout(greetTimer);
      clearTimeout(sleepTimerRef.current);
      clearTimeout(wakeTimerRef.current);
      clearTimeout(overpokeTimerRef.current);
      clearTimeout(typingTimerRef.current);
    };
  }, [isOpen, scheduleSleep]);

  // Trigger a celebratory burst when a reset email succeeds
  useEffect(() => {
    if (forgotSuccess) {
      setCelebrate((n) => n + 1);
    }
  }, [forgotSuccess]);

  // Show sad reaction on new errors until the user edits or moves focus
  useEffect(() => {
    setErrorAck(false);
  }, [error]);

  useEffect(() => {
    if (error) {
      setErrorAck(true);
    }
  }, [activeTextLength, focusedField]);

  // Nod gently while typing in name or email fields
  useEffect(() => {
    if (focusedField === 'name' || focusedField === 'email') {
      setIsTyping(true);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setIsTyping(false), 600);
    } else {
      setIsTyping(false);
    }
  }, [activeTextLength, focusedField]);

  // Wake from sleep when focusing inputs or typing, and keep sleep timer fresh on activity
  useEffect(() => {
    if (focusedField || submitting || hoverTarget) {
      setIsSleepy(false);
      scheduleSleep();
    }
  }, [focusedField, activeTextLength, submitting, hoverTarget, scheduleSleep]);

  // Update gaze to track focused input caret position
  useEffect(() => {
    if (focusedField === 'password') {
      gazeX.set(-14);
      gazeY.set(6);
      return;
    }

    if ((focusedField === 'name' || focusedField === 'email') && activeInputEl && blobRef.current) {
      const blobRect = blobRef.current.getBoundingClientRect();
      const inputRect = activeInputEl.getBoundingClientRect();
      const blobCx = blobRect.left + blobRect.width / 2;
      const blobCy = blobRect.top + blobRect.height / 2;
      const caretX = Math.min(inputRect.right - 20, inputRect.left + 20 + activeTextLength * 7.5);
      const caretY = inputRect.top + inputRect.height / 2;

      gazeX.set(clamp((caretX - blobCx) / 8, -28, 28));
      gazeY.set(clamp((caretY - blobCy) / 8, -20, 20));
    }
  }, [focusedField, activeInputEl, activeTextLength, gazeX, gazeY]);

  // Smooth cursor tracking across the modal while idle (no React re-renders on mousemove)
  useEffect(() => {
    const modalEl = modalRef?.current;
    if (!modalEl) return undefined;

    let rafId = 0;

    const handlePointerMove = (e) => {
      if (!isSleepyRef.current) {
        scheduleSleep();
      }
      if (focusedField || isSleepyRef.current) return;

      const clientX = e.clientX;
      const clientY = e.clientY;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!blobRef.current) return;
        const rect = blobRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        gazeX.set(clamp((clientX - cx) / 10, -24, 24));
        gazeY.set(clamp((clientY - cy) / 10, -16, 16));
      });
    };

    const handlePointerLeave = () => {
      if (!focusedField) {
        gazeX.set(0);
        gazeY.set(0);
      }
    };

    const handleKeyActivity = () => {
      setIsSleepy(false);
      scheduleSleep();
    };

    modalEl.addEventListener('pointermove', handlePointerMove, { passive: true });
    modalEl.addEventListener('pointerleave', handlePointerLeave);
    modalEl.addEventListener('keydown', handleKeyActivity, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      modalEl.removeEventListener('pointermove', handlePointerMove);
      modalEl.removeEventListener('pointerleave', handlePointerLeave);
      modalEl.removeEventListener('keydown', handleKeyActivity);
    };
  }, [isOpen, modalRef, focusedField, scheduleSleep, gazeX, gazeY]);

  const handlePoke = useCallback(() => {
    // Do not clear sleep on poke 1 or 2 so the third poke can fire onWake
    if (!isSleepyRef.current) {
      scheduleSleep();
    }
  }, [scheduleSleep]);

  const handleOverpoke = useCallback(() => {
    setOverpokeMood(true);
    clearTimeout(overpokeTimerRef.current);
    overpokeTimerRef.current = setTimeout(() => {
      setOverpokeMood(false);
    }, 2400);
    scheduleSleep();
  }, [scheduleSleep]);

  const handleWake = useCallback(() => {
    setIsSleepy(false);
    setWokeMood(true);
    clearTimeout(wakeTimerRef.current);
    wakeTimerRef.current = setTimeout(() => {
      setWokeMood(false);
    }, 2200);
    scheduleSleep();
  }, [scheduleSleep]);

  // Priority-ordered mood state machine.
  // Note: avoid feral-blob's 'happy' mood in dev mode because its upstream preset
  // pairs 4-element keyframe arrays with `type: "spring"`, which Motion rejects.
  // 'wave' shares the closed ^_^ smile arcs while using tween keyframes cleanly.
  let mood = 'neutral';
  if (submitting) {
    mood = 'wave';
  } else if (forgotSuccess) {
    mood = 'love';
  } else if (overpokeMood) {
    mood = 'angry';
  } else if (wokeMood) {
    mood = 'surprised';
  } else if (focusedField === 'password') {
    mood = showPassword ? 'sideEye' : 'password';
  } else if (isSleepy) {
    mood = 'sleepy';
  } else if (hoverTarget === 'close') {
    mood = 'sad';
  } else if (error && !errorAck) {
    mood = 'sad';
  } else if (focusedField === 'name' || focusedField === 'email') {
    mood = 'curious';
  } else if (hoverTarget === 'submit') {
    mood = 'wave';
  } else if (hoverTarget === 'google') {
    mood = 'love';
  } else if (greeting) {
    mood = 'wave';
  }

  const speechMessages = useMemo(
    () => ({
      wave: submitting
        ? 'Almost there…'
        : hoverTarget === 'submit'
          ? 'Let’s do this!'
          : mode === 'register'
            ? 'Welcome aboard!'
            : 'Hey there!',
      neutral: 'Ready when you are.',
      curious:
        focusedField === 'name'
          ? 'Nice to meet you!'
          : mode === 'forgot'
            ? 'Let’s find your account.'
            : 'Reading along…',
      password: 'Not peeking!',
      sideEye: 'Oh, showing it?',
      sleepy: 'Five more min…',
      surprised: 'Whoa! I’m up!',
      angry: 'Hey, stop poking!',
      sad: hoverTarget === 'close' ? 'Leaving already?' : 'Oops, check that!',
      love: forgotSuccess ? 'Check your inbox!' : 'One-click easy!',
    }),
    [mode, focusedField, hoverTarget, submitting, forgotSuccess]
  );

  const sparkle = submitting || hoverTarget === 'submit' || hoverTarget === 'google';

  return (
    <div className="subspens-blob-stage relative flex flex-row sm:flex-col items-center justify-center gap-3 sm:gap-1 rounded-2xl squircle border border-line/70 bg-gradient-to-b from-ledger-light/45 via-ledger-light/20 to-paper/40 px-4 py-2 sm:px-3 sm:py-5 sm:w-[196px] sm:shrink-0">
      {/* Desktop speech cloud above the blob */}
      {isDesktop && (
        <div className="flex min-h-[56px] w-full items-end justify-center">
          <BlobSpeech mood={mood} messages={speechMessages} />
        </div>
      )}

      {/* Interactive SVG jelly blob mascot */}
      <div ref={blobRef} className="w-20 sm:w-44 -my-2 sm:-mt-1 sm:-mb-2 shrink-0">
        <JellyBlobMascot
          mood={mood}
          eyeStyle="v1"
          gaze={gaze}
          nod={isTyping}
          sparkle={sparkle}
          celebrate={celebrate}
          onPoke={handlePoke}
          onOverpoke={handleOverpoke}
          onWake={handleWake}
          className="w-full h-auto select-none"
        />
      </div>

      {/* Compact mobile reaction pill */}
      {!isDesktop && (
        <div className="flex flex-1 items-center justify-start">
          <span className="inline-block rounded-xl squircle border border-ledger/15 bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs">
            {speechMessages[mood] || 'Ready when you are.'}
          </span>
        </div>
      )}
    </div>
  );
}
