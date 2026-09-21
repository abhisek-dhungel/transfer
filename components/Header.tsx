import React from 'react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-5xl mx-auto flex justify-between items-center py-4 px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 15a4 4 0 004 4h10a4 4 0 001.38-7.758A5 5 0 0012 5a5 5 0 00-4.9 4.005A4 4 0 003 15z"/>
            </svg>
          </span>
          <span className="text-lg font-bold text-gray-900">TechSastra <span className="text-blue-700">Send</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
          <Link href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</Link>
          <Link href="#security" className="hover:text-gray-900 transition-colors">Security</Link>
          <a href="https://techsastra.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">TechSastra</a>
        </nav>
        <span className="text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">No account required</span>
      </div>
    </header>
  );
}
