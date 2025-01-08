import { PublicKey } from '@solana/web3.js'

export interface Pool {
  name: string
  apy: string
  address: string
  type: string
}

export interface YieldPools {
  kamino: Pool[]
  orca: Pool[]
}

export interface TokenData {
  name: string
  price: number
  price_change_percentage_24h: number
  strategy: string
  risk_factors: string[]
}

export interface CoinGeckoResponse {
  high_risk_tokens: TokenData[]
  other_tokens: TokenData[]
  summary: {
    total_tokens: number
    high_risk_count: number
    timestamp: string
  }
}

export interface WalletBalance {
  balance: number
  usdValue: number
  growth: number
}

export interface AllocationItem {
  name: string
  percentage: number
  value: number
}

export interface Transaction {
  id: string
  type: string
  description: string
  timestamp: string
  amount: number
}

export interface Strategy {
  type: string
  transactions: Transaction[]
}

export interface StrategyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (strategyType: string, transaction: Transaction[]) => void
}

export interface ExecutionResult {
  signature: string
  type: string
  description: string
  amount: number
}