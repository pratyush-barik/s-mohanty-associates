"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface ProfileDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onLogout: () => Promise<void>;
}

export function ProfileDropdown({ user, onLogout }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "C";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-full hover:bg-slate-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1e3a5f] to-[#b8860b] p-[2px] shadow-sm">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
            {user.image ? (
              <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#0f2038] font-bold text-sm">{initials}</span>
            )}
          </div>
        </div>
        <div className="text-left hidden md:block">
          <p className="text-xs font-semibold text-[#0f2038] leading-tight">{user.name || "Client User"}</p>
          <p className="text-[10px] text-[#6c757d] leading-tight truncate max-w-[120px]">{user.email}</p>
        </div>
        <svg className={`w-4 h-4 text-[#6c757d] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
            <p className="text-xs font-bold text-[#0f2038] truncate">{user.name}</p>
            <p className="text-[11px] text-[#6c757d] truncate">{user.email}</p>
          </div>

          <div className="space-y-0.5">
            <Link
              href="/dashboard/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#495057] rounded-xl hover:bg-slate-50 hover:text-[#0f2038] transition-colors"
            >
              <svg className="w-4 h-4 text-[#b8860b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </Link>

            <Link
              href="/dashboard/requests"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#495057] rounded-xl hover:bg-slate-50 hover:text-[#0f2038] transition-colors"
            >
              <svg className="w-4 h-4 text-[#b8860b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Service Requests
            </Link>

            <Link
              href="/dashboard/projects"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#495057] rounded-xl hover:bg-slate-50 hover:text-[#0f2038] transition-colors"
            >
              <svg className="w-4 h-4 text-[#b8860b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              My Projects
            </Link>
          </div>

          <div className="border-t border-slate-100 mt-1 pt-1">
            <button
              onClick={async () => {
                setIsOpen(false);
                await onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
            >
              <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4-4H7m6 4v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
