import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TechSastra Send — Send Files Securely Without an Account',
  description: "Send files up to 100 MB directly to someone's email with TechSastra Send. No account required. Fast, simple and secure file sharing.",
  openGraph: {
    title: 'TechSastra Send — Send Files Securely',
    description: "Send files up to 100 MB directly to someone's email. No account required.",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'TechSastra Send',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
