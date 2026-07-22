"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Logo from "./Logo";

const links = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/stories", label: "Stories" },
  { href: "/resources", label: "Resources" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-cream/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo height={26} />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-stone-600 hover:text-sage-700 text-sm font-medium transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-stone-600 hover:text-sage-700 text-sm font-medium transition-colors px-3 py-2">
              Log in
            </Link>
            <Link href="/register" className="bg-sage-700 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-sage-800 transition-colors">
              Get Started Free
            </Link>
          </div>

          {/* Mobile burger button */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-lg hover:bg-stone-100 transition-colors"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <span className="w-5 h-0.5 bg-stone-700 rounded-full" />
            <span className="w-5 h-0.5 bg-stone-700 rounded-full" />
            <span className="w-3.5 h-0.5 bg-stone-700 rounded-full self-start ml-[5px]" />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:hidden ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-stone-100">
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center">
            <Logo height={24} />
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Drawer links */}
        <div className="flex flex-col px-4 py-6 gap-1 flex-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-stone-700 font-medium hover:bg-stone-50 hover:text-sage-700 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Drawer footer CTAs */}
        <div className="px-4 pb-8 flex flex-col gap-3 border-t border-stone-100 pt-6">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="w-full text-center text-stone-700 font-medium py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors text-sm"
          >
            Log in
          </Link>
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="w-full text-center bg-sage-700 text-white font-semibold py-2.5 rounded-xl hover:bg-sage-800 transition-colors text-sm"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </>
  );
}
