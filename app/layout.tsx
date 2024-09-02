import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  subsets: ["latin"],
  weight: ["100","200","300","400","500","600","700","800","900"]
});

export const metadata: Metadata = {
  title: 'Abstract Chain Wallet | Passkey Integration',
  description: 'Create and manage your Abstract chain wallet securely with Passkey integration. Protect your private keys with the latest WebAuthn technology and store them safely on your device.',
  keywords: 'Abstract Chain Wallet, Passkey, WebAuthn, zkSync wallet, Wallet Abstraction, Decentralized Wallet',
  openGraph: {
    title: 'Secure Abstract Chain Wallet with Passkey',
    description: 'Decentralized apps for securely managing Abstract Chain wallets using Passkey for private key encryption and storage.',
    url: 'https://abstractwallet.vercel.app',
    type: 'website',
    images: [
      {
        url: 'https://abstractwallet.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Secure Abstract Chain Wallet with Passkey',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Secure Abstract Chain Wallet with Passkey',
    description: 'Manage your Abstract Chain wallet securely with Passkey integration. The ultimate protection for your crypto assets.',
    images: ['https://abstractwallet.vercel.app/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={kanit.className}>{children}</body>
    </html>
  );
}
