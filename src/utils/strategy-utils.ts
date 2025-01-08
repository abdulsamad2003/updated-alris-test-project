import web3 from '@solana/web3.js'
export const executeStrategy = async (
    wallet: web3.Keypair,
    targetAddress: web3.PublicKey,
    amount: number
  ) => {
    const connection = new web3.Connection(web3.clusterApiUrl('devnet'))
    
    const transaction = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: targetAddress,
        lamports: amount
      })
    )
    
    const signature = await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet]
    )
    
    return signature
  }
  
  export const generateStrategyPrompt = (riskLabel: string, pools: any) => {
    return `Generate optimal yield farming strategy with following parameters:
      Risk Profile: ${riskLabel}
      Available Pools: ${JSON.stringify(pools)}
      Initial Investment: 1 SOL
      Goal: Maximize yield while maintaining ${riskLabel.toLowerCase()} risk exposure`
  }
  
