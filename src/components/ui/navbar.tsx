'use client'

import { Wallet } from 'lucide-react';
import Image from "next/image";
import Link from "next/link";
import React from 'react';
import dynamic from 'next/dynamic';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from "@/components/ui/button";

// Dynamically import the WalletMultiButton to avoid SSR issues
const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export function Navbar() {
  const { publicKey } = useWallet();

  return (
    <nav className="border-b border-[--border-color] bg-[#0A0B0F]">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/static/logo.png?height=32&width=32"
            alt="Alris logo"
            width={40}
            height={40}
            
          />
          <span className="font-semibold text-white">Alris</span>
        </Link>

        <div className="wallet-adapter-button-trigger">
          <WalletMultiButtonDynamic>

            <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground shadow h-9 px-4 py-2 gap-2  bg-[--purple-color] hover:bg-[--input-bg] border hover:border-[--border-color]">
              <Wallet className="w-4 h-4" />
              {publicKey 
                ? `${publicKey.toBase58().substring(0, 7)}...`
                : 'Connect Wallet'
              }
            </div>
           
          </WalletMultiButtonDynamic>
        </div>
      </div>
    </nav>
  );
}