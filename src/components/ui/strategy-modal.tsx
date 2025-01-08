'use client'

import { useState, FormEvent } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Wallet, AlertCircle } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import * as web3 from '@solana/web3.js'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SolanaAgentKit } from "solana-agent-kit"
import { StrategyModalProps, YieldPools, Transaction, ExecutionResult } from "@/utils/types"
import bs58 from 'bs58';
// Initialize SolanaAgentKit with environment variables
const privateKeyArray = JSON.parse(process.env.NEXT_PUBLIC_ALRIS_PRIVATE_KEY!);
const base58Key = bs58.encode(Uint8Array.from(privateKeyArray));
const agent = new SolanaAgentKit(
    base58Key!,
    web3.clusterApiUrl("devnet"),
    process.env.NEXT_PUBLIC_OPENAI_API_KEY!
  );
const YIELD_POOLS: YieldPools = {
  kamino: [
    { name: "SOL-USDC", apy: "12.5%", address: "GQUcvJCFsL1QMFfcW6Z8YtnJhrRhfhWt4KhjyjvtMSJD", type: "Kamino LP" },
    { name: "BONK-SOL", apy: "18.2%", address: "8R2VvaBCSaKJvL2khvTRUDe7fkJar94Wi4H9ouLGcoJh", type: "Kamino LP" }
  ],
  orca: [
    { name: "SOL/USDT", apy: "10.8%", address: "GQUcvJCFsL1QMFfcW6Z8YtnJhrRhfhWt4KhjyjvtMSJD", type: "Orca Pool" },
    { name: "ORCA/SOL", apy: "15.4%", address: "8R2VvaBCSaKJvL2khvTRUDe7fkJar94Wi4H9ouLGcoJh", type: "Whirlpool" }
  ]
}
const TRADING_PAIRS = [
  { name: "SOL/USDC", address: "GQUcvJCFsL1QMFfcW6Z8YtnJhrRhfhWt4KhjyjvtMSJD", type: "Spot Trading" },
  { name: "BONK/SOL", address: "8R2VvaBCSaKJvL2khvTRUDe7fkJar94Wi4H9ouLGcoJh", type: "Spot Trading" }
]
const executeStrategy = async (
  targetAddress: web3.PublicKey,
  amount: number
): Promise<string> => {
  try {
    return await agent.transfer(
      targetAddress,
      amount / web3.LAMPORTS_PER_SOL
    )
  } catch (error) {
    throw new Error(`Strategy execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function StrategyModal({ open, onOpenChange, onComplete }: StrategyModalProps) {
  const [strategyType, setStrategyType] = useState<"yield" | "trading">("yield")
  const [riskLevel, setRiskLevel] = useState<number>(50)
  const [stopLoss, setStopLoss] = useState<string>("10")
  const [isTransferring, setIsTransferring] = useState<boolean>(false)
  const [showFundingStep, setShowFundingStep] = useState<boolean>(false)
  const [transferError, setTransferError] = useState<string>("")
  const [executionStatus, setExecutionStatus] = useState<string>("")

  const { publicKey, connected, sendTransaction } = useWallet()
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!connected) {
      setTransferError("Please connect your wallet first")
      return
    }
    setShowFundingStep(true)
  }

  const getRiskLabel = (value: number): string => {
    if (value <= 33) return "Low"
    if (value <= 66) return "Medium"
    return "High"
  }

  const getRiskDescription = (value: number): string => {
    if (value <= 33) return "Focus on stablecoins and low-risk yield pools."
    if (value <= 66) return "Include moderate risk pools with limited exposure to volatile assets."
    return "Emphasize high-yield pools and aggressive trading strategies for maximum returns."
  }

  
const executeYieldStrategy = async (): Promise<Transaction[]> => {
  try {
    const pools = YIELD_POOLS[riskLevel <= 33 ? 'orca' : 'kamino']
    const amount = web3.LAMPORTS_PER_SOL / pools.length

    const transactions: Transaction[] = []
    for (const pool of pools) {
      const signature = await executeStrategy(
        new web3.PublicKey(pool.address),
        amount
      )
      setExecutionStatus(`Funded ${pool.type} (tx: ${signature.substring(0, 8)}...)`)
      transactions.push({
        id: signature,
        type: pool.type,
        description: `Invested in ${pool.name} pool`,
        timestamp: new Date().toISOString(),
        amount: amount / web3.LAMPORTS_PER_SOL
      })
    }
    return transactions
  } catch (error) {
    throw new Error(`Yield strategy execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}


const executeTradingStrategy = async (): Promise<Transaction[]> => {
  try {
    const selectedPairs = TRADING_PAIRS
    const amount = web3.LAMPORTS_PER_SOL / selectedPairs.length
    
    const transactions: Transaction[] = []
    for (const pair of selectedPairs) {
      const signature = await executeStrategy(
        new web3.PublicKey(pair.address),
        amount
      )
      setExecutionStatus(`Traded pair: ${pair.name} (tx: ${signature.substring(0, 8)}...)`)
      transactions.push({
        id: signature,
        type: pair.type, // Using the type from TRADING_PAIRS
        description: `Traded ${pair.name} pair`,
        timestamp: new Date().toISOString(),
        amount: amount / web3.LAMPORTS_PER_SOL
      })
    }
    return transactions
  } catch (error) {
    throw new Error(`Trading strategy execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

  const handleTransfer = async (): Promise<void> => {
    if (!publicKey) return
    
    setIsTransferring(true)
    setTransferError("")
    
    try {
      const connection = new web3.Connection(web3.clusterApiUrl('devnet'))
      
      // Transfer from user wallet to Alris wallet
      const transaction = new web3.Transaction().add(
        web3.SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: agent.wallet_address,
          lamports: web3.LAMPORTS_PER_SOL
        })
      )

      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')
      
      // Execute strategy
      const strategyTransactions = await (strategyType === "yield" 
        ? executeYieldStrategy()
        : executeTradingStrategy())
      
      onComplete(strategyType, strategyTransactions)
      onOpenChange(false)
    } catch (error) {
      console.error("Transfer/execution error:", error)
      setTransferError(`Failed to process transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsTransferring(false)
    }
  }



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#2a0633] text-white border border-[--border-color]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {showFundingStep ? "Fund Your Alris Wallet" : "Customize Your Strategy and Risk Profile"}
          </DialogTitle>
          <DialogDescription className="text-blue-100/70">
            {showFundingStep 
              ? "Transfer 1 SOL to start using your selected strategy"
              : "Choose how Alris will manage your portfolio to optimize returns based on your preferences."
            }
          </DialogDescription>
        </DialogHeader>

        {!showFundingStep ? (
          <form onSubmit={handleSubmit} className="space-y-8 pt-4">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Market Strategy</Label>
              <RadioGroup 
                value={strategyType} 
                onValueChange={(value: "yield" | "trading") => setStrategyType(value)} 
                className="space-y-4"
              >                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="yield" id="yield" className="mt-1 border-white data-[state=checked]:bg-[--purple-color] data-[state=checked]:border-[--purple-color]" />
                  <div>
                    <Label htmlFor="yield" className="text-base font-medium">Yield Optimization</Label>
                    <p className="text-sm text-blue-100/70">
                      Maximize returns by reallocating funds dynamically between high-yield pools.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="trading" id="trading" className="mt-1 border-white data-[state=checked]:bg-[--purple-color] data-[state=checked]:border-[--purple-color]" />
                  <div>
                    <Label htmlFor="trading" className="text-base font-medium">Trading Strategy</Label>
                    <p className="text-sm text-blue-100/70">
                      Engage in intelligent trading based on market trends to capture gains.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Risk Level</Label>
                <span className="text-sm text-[#fff] font-bold">
                  {getRiskLabel(riskLevel)}
                </span>
              </div>
              <Slider
                value={[riskLevel]}
                onValueChange={([value]) => setRiskLevel(value)}
                max={100}
                step={1}
                className="[&_[role=slider]]:bg-[--border-color] [&_[role=slider]]:border-[--border-color] [&_[role=slider]]:ring-offset-background [&_[role=slider]]:hover:border-purple-100 [&>.bg-primary]:bg-purple-100 [&_[role=track]]:bg-[--border-color]  [&_[role=range]]:bg-[--skyBlue-color]"
              />
              <p className="text-sm text-blue-100/70">
                {getRiskDescription(riskLevel)}
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold" htmlFor="stop-loss">
                Stop-Loss Threshold
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="stop-loss"
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  min="1"
                  max="50"
                  className="bg-background/5 border-background/10"
                />
                <span className="text-blue-100/70">%</span>
              </div>
              <p className="text-sm text-blue-100/70">
                Maximum acceptable loss before automatically closing positions.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[--purple-color] hover:bg-[--input-bg] border hover:border-[--border-color]"
              disabled={!connected}
            >
              <Check className="w-4 h-4 mr-2" />
              Continue to Funding
            </Button>
          </form>
        ) : (
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-100/70">Amount to Transfer</span>
                <span className="font-medium">1 SOL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-100/70">Selected Strategy</span>
                <span className="font-medium">{strategyType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-100/70">Risk Level</span>
                <span className="font-medium">{getRiskLabel(riskLevel)}</span>
              </div>
              {executionStatus && (
                <div className="mt-4 text-sm text-blue-100/70">
                  {executionStatus}
                </div>
              )}
            </div>

            <Button 
              onClick={handleTransfer}
              disabled={isTransferring || !connected}
              className="w-full bg-[--purple-color] hover:bg-[--input-bg] border hover:border-[--border-color]"
            >
              <Wallet className="w-4 h-4 mr-2" />
              {isTransferring ? "Processing..." : "Transfer 1 SOL"}
            </Button>

            {transferError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{transferError}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}