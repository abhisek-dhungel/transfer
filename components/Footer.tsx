import Link from 'next/link';
export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-24">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <p className="font-bold text-gray-900">TechSastra <span className="text-blue-700">Transfer</span></p>
          <p className="text-sm text-gray-500 mt-0.5">Transfer files. Simply.</p>
        </div>
        <nav className="flex gap-5 text-sm text-gray-500">
          <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
          <a href="https://techsastra.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">TechSastra</a>
        </nav>
        <p className="text-xs text-gray-400">© 2026 TechSastra. All rights reserved.</p>
      </div>
    </footer>
  );
}
