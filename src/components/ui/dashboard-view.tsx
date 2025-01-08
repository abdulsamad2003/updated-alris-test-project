'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StopCircle, TrendingUp, PieChart, History } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { useWallet } from '@solana/wallet-adapter-react'
import * as web3 from '@solana/web3.js'
import { SolanaAgentKit } from "solana-agent-kit"
import { 
  TokenData, 
  CoinGeckoResponse, 
  WalletBalance, 
  AllocationItem,
  Transaction,
  Strategy 
} from "@/utils/types"
import bs58 from 'bs58'
const privateKeyArray = JSON.parse(process.env.NEXT_PUBLIC_ALRIS_PRIVATE_KEY!);
const base58Key = bs58.encode(Uint8Array.from(privateKeyArray));
const agent = new SolanaAgentKit(
    base58Key!,
    web3.clusterApiUrl("devnet"),
    process.env.NEXT_PUBLIC_OPENAI_API_KEY!
  );
export function DashboardView() {
  const { publicKey } = useWallet()
  const [tokenData, setTokenData] = useState<TokenData[]>([])
  const [walletBalance, setWalletBalance] = useState<WalletBalance>({ 
    balance: 0, 
    usdValue: 0,
    growth: 0
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [allocation, setAllocation] = useState<AllocationItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null)

  const updateAllocation = (balance: number, strategy: Strategy | null): void => {
    if (!strategy) {
      setAllocation([
        { name: 'Available Balance', percentage: 100, value: balance },
        { name: 'Allocated', percentage: 0, value: 0 }
      ])
      return
    }
  
    const allocations = strategy.transactions.reduce((acc: { [key: string]: number }, tx) => {
      if (!acc[tx.type]) {
        acc[tx.type] = 0
      }
      acc[tx.type] += tx.amount
      return acc
    }, {})
  
    const totalValue = Object.values(allocations).reduce((sum, value) => sum + value, 0)
    
    setAllocation(
      Object.entries(allocations).map(([name, value]) => ({
        name,
        percentage: Math.round((value / totalValue) * 100),
        value: value * (balance / totalValue)
      }))
    )
  }
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const response = await fetch('/api/coingecko');
        const data: CoinGeckoResponse = await response.json();
        const allTokens: TokenData[] = [...data.high_risk_tokens, ...data.other_tokens];
        setTokenData(allTokens);
  
        if (publicKey) {
          // Get user wallet balance
          const connection = new web3.Connection(web3.clusterApiUrl('devnet'));
          const userBalance = await connection.getBalance(publicKey);
  
          // Get Alris wallet balance using Agent Kit          
          const alrisBalance = await agent.getBalance();
          const totalBalance = (userBalance / web3.LAMPORTS_PER_SOL) + (alrisBalance ?? 0);
  
          const solToken = allTokens.find(token => token.name === "Solana");
          const solPrice = solToken?.price || 0;
          const solGrowth = solToken?.price_change_percentage_24h || 0;
  
          const usdValue = totalBalance * solPrice;
          setWalletBalance({
            balance: totalBalance,
            usdValue,
            growth: solGrowth
          });
  
          updateAllocation(usdValue, activeStrategy);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
  
    // Call fetchData immediately
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [publicKey, activeStrategy]);
  
  const handleStrategyComplete = (strategyType: string, strategyTransactions: Transaction[]): void => {
    setActiveStrategy({
      type: strategyType,
      transactions: strategyTransactions
    })
    setTransactions(prev => [...strategyTransactions, ...prev])
  }

  const handleStopStrategy = (): void => {
    setActiveStrategy(null)
    updateAllocation(walletBalance.usdValue, null)
  }

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-[#111218] border-blue-900/20">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-blue-900/20 rounded w-1/4"></div>
              <div className="h-8 bg-blue-900/20 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Portfolio Overview */}
      <Card className="bg-[#111218] border-blue-900/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium text-white">Portfolio Overview</CardTitle>
          <Button 
            variant="destructive" 
            className="bg-red-600 hover:bg-red-700"
            onClick={handleStopStrategy}
          >
            <StopCircle className="mr-2 h-4 w-4" />
            Stop Strategy
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-blue-100/70">Total Value</p>
                <p className="text-2xl font-bold text-white">
                  ${walletBalance.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-blue-100/70">
                  {walletBalance.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-sm text-blue-100/70">24h Growth</p>
                <p className={`text-2xl font-bold ${walletBalance.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {walletBalance.growth >= 0 ? '+' : ''}{walletBalance.growth.toFixed(2)}%
                  <TrendingUp className="inline ml-1 h-5 w-5" />
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Allocation */}
      <Card className="bg-[#111218] border-blue-900/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-white">Current Allocation</CardTitle>
            <PieChart className="h-4 w-4 text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allocation.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white">{item.name}</span>
                  <span className="font-medium text-white">{item.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-blue-950">
                  <div 
                    className="h-full rounded-full bg-blue-600" 
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="text-sm text-blue-100/70">
                  ${item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="lg:col-span-2 bg-[#111218] border-blue-900/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-white">Recent Transactions</CardTitle>
            <History className="h-4 w-4 text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-lg border border-blue-900/10 bg-blue-950/20 p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">{transaction.description}</p>
                      <p className="text-xs text-blue-100/70">{transaction.timestamp}</p>
                    </div>
                    <span className="text-xs font-medium text-blue-400">
                      {transaction.type}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-blue-100/70">
                  Transaction history will appear here as your strategy executes
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}