'use client'

import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Settings, BotIcon as Robot } from 'lucide-react';
import { useState, useEffect } from "react";
import { StrategyModal } from "@/components/ui/strategy-modal";
import { DashboardView } from "@/components/ui/dashboard-view";
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export default function Dashboard() {
  const { publicKey } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [isStrategyActive, setIsStrategyActive] = useState(false);

  // Update step when wallet is connected
  useEffect(() => {
    if (publicKey && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [publicKey, currentStep]);

  const handleStrategyComplete = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleStartStrategy = () => {
    setIsStrategyActive(true);
  };

  const steps = [
    {
      icon: Wallet,
      title: "Connect Your Wallet",
      description: "Link your Solana wallet and start exploring.",
      action: "Connect Wallet",
      onClick: () => {} // The WalletMultiButton will handle the connection
    },
    {
      icon: Settings,
      title: "Set Your Preferences",
      description: "Choose your strategy and risk level.",
      action: "Configure",
      onClick: () => setShowStrategyModal(true)
    },
    {
      icon: Robot,
      title: "Automated Optimization",
      description: "Sit back as Alris intelligently manages your assets.",
      action: "Start",
      onClick: handleStartStrategy
    }
  ];

  if (isStrategyActive) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] text-white">
        <Navbar />
        <main className="container mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold mb-8 text-white">Strategy Dashboard</h1>
          <DashboardView />
        </main>
      </div>
    );
  }

  return (
    <div style={{
      backgroundImage: "url('/static/bg-5.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      height: "100%",
      width: "100%"
    }}
     className="min-h-screen bg-[#0A0B0F] text-white">
      <Navbar />
      
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Get Started with Alris</h1>
          
          <div className="grid gap-6">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index + 1 === currentStep;
              const isCompleted = index + 1 < currentStep;

              return (
                <Card
                  key={index}
                  className={`bg-[--input-bg] border-[--border-color] ${
                    isActive ? 'ring-2 ring-[--border-color]' : ''
                  }`}
                >
                  <CardContent className="flex items-center gap-6 p-6">
                    <div className={`p-3 rounded-full ${
                      isCompleted ? 'bg-blue-500/10' : 'bg-blue-500/10'
                    }`}>
                      <StepIcon className={`w-6 h-6 ${
                        isCompleted ? 'text-[--purple-color]' : 'text-[--purple-color]'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1 text-white">{step.title}</h3>
                      <p className="text-blue-100/70">{step.description}</p>
                    </div>
                    {isActive && index === 0 ? (
                      <div className="wallet-adapter-button-trigger">
                        <WalletMultiButtonDynamic>
                        <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground shadow h-9 px-4 py-2 gap-2 bg-[--purple-color] hover:bg-[--input-bg] border hover:border-[--border-color]">
                          <Wallet className="w-4 h-4" />
                              {publicKey 
                                ? `${publicKey.toBase58().substring(0, 7)}...`
                                : 'Connect Wallet'
                              }
                          </div>
                        
                        </WalletMultiButtonDynamic>
                      </div>
                    ) : isActive && (
                      <Button
                        className="bg-[--purple-color] border border-[--border-color] hover:bg-purple-900"
                        onClick={step.onClick}
                      >
                        {step.action}
                      </Button>
                    )}
                    {isCompleted && (
                      <div className="text-[#fff]">Completed</div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      <StrategyModal
        open={showStrategyModal}
        onOpenChange={setShowStrategyModal}
        onComplete={handleStrategyComplete}
      />
    </div>
  );
}