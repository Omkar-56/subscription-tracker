"use client";

import { useState } from "react";
import Link from "next/link";

export default function RadialFillButton({
  href,
  type = "button",
  onClick,
  onMouseEnter,
  onMouseLeave,
  disabled = false,
  className = "",
  contentClassName = "",
  fillClassName = "bg-ledger-dark",
  children,
  ...rest
}) {
  const [fill, setFill] = useState({
    x: 0,
    y: 0,
    size: 0,
    hovered: false,
  });

  const handlePointer = (e, hovered) => {
    if (disabled && hovered) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size =
      Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y)) * 2;
    setFill({ x, y, size, hovered });
  };

  const sharedProps = {
    onMouseEnter: (e) => {
      handlePointer(e, true);
      onMouseEnter?.(e);
    },
    onMouseLeave: (e) => {
      handlePointer(e, false);
      onMouseLeave?.(e);
    },
    className: `relative inline-flex items-center justify-center overflow-hidden ${className}`,
    ...rest,
  };

  const content = (
    <>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute rounded-full transition-transform duration-500 ease-out ${fillClassName}`}
        style={{
          left: `${fill.x}px`,
          top: `${fill.y}px`,
          width: `${fill.size}px`,
          height: `${fill.size}px`,
          transform: `translate(-50%, -50%) scale(${fill.hovered && !disabled ? 1 : 0})`,
        }}
      />
      <span
        className={`relative z-10 inline-flex items-center justify-center ${contentClassName}`}
      >
        {children}
      </span>
    </>
  );

  if (href) {
    if (href.startsWith("#")) {
      return (
        <a href={href} {...sharedProps}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} {...sharedProps}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} {...sharedProps}>
      {content}
    </button>
  );
}
