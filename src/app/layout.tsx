import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import LoadingWatcher from '@/components/LoadingWatcher';
import ThemeProvider from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ATS Lite - Watch the ATS Think',
  description:
    'A modern Applicant Tracking System that shows off front-end polish, back-end logic, and a transparent agent loop. Query candidates with natural language and watch the AI think step by step.',
  keywords: [
    'ATS',
    'Applicant Tracking System',
    'AI',
    'Natural Language Processing',
    'Candidate Search',
    'Recruitment',
    'Next.js',
    'React',
    'TypeScript',
    'MCP Workflow',
    'OpenAI',
  ],
  authors: [{ name: 'Tomiwa' }],
  creator: 'Tomiwa',
  publisher: 'ATS Lite',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ats-lite-seven.vercel.app/',
    siteName: 'ATS Lite',
    title: 'ATS Lite - Watch the ATS Think',
    description:
      'A modern Applicant Tracking System with AI-powered natural language search. Query candidates and watch the transparent MCP workflow in action.',
    images: [
      {
        url: 'https://ats-lite-seven.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ATS Lite - Modern Applicant Tracking System',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@ats_lite',
    creator: '@tomiwa',
    title: 'ATS Lite - Watch the ATS Think',
    description:
      'Modern ATS with AI-powered candidate search. Query with natural language and see the transparent workflow.',
    images: ['https://ats-lite-seven.vercel.app/og-image.png'],
  },
  verification: {
    google: 'google-site-verification-code-here', // Replace with actual verification code
  },
  category: 'technology',
  classification: 'Business Software',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ats-lite-seven.vercel.app'),
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/og-image.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ATS Lite',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ATS Lite',
    description:
      'A modern Applicant Tracking System with AI-powered natural language search. Query candidates and watch the transparent MCP workflow in action.',
    url: 'https://ats-lite-seven.vercel.app',
    author: {
      '@type': 'Person',
      name: 'Tomiwa',
    },
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    screenshot: 'https://ats-lite-seven.vercel.app/og-image.png',
    softwareVersion: '1.0.0',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      ratingCount: '1',
    },
  };

  return (
    <html lang='en'>
      <head>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <LoadingWatcher />
          {children}
          <Toaster position='top-right' />
        </ThemeProvider>
      </body>
    </html>
  );
}
