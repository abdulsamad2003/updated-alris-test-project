export const createCrossmintWallet = async (email: string) => {
    const response = await fetch("https://staging.crossmint.com/api/v1-alpha2/wallets", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.NEXT_PUBLIC_CROSSMINT_API_KEY!,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "solana-mpc-wallet",
        linkedUser: `email:${email}`
      })
    });
    return await response.json();
  };
  
  export const fundCrossmintWallet = async (walletAddress: string, amount: number) => {
    const response = await fetch(`https://staging.crossmint.com/api/v1-alpha2/wallets/${walletAddress}/balances`, {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.NEXT_PUBLIC_CROSSMINT_API_KEY!,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount,
        currency: "usdc"
      })
    });
    return await response.json();
  };