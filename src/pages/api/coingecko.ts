import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-cg-demo-api-key': 'CG-P3LQp7LCUwcYWigpmnnXWuEK',
    },
  };

  try {
    const response = await fetch('https://api.coingecko.com/api/v3/search/trending', options);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && data.coins) {
      const coinDetails = await Promise.all(
        data.coins.map(async (coin: any) => {
          const coinId = coin.item.id;
          const coinInfoResponse = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`, options);

          if (!coinInfoResponse.ok) {
            throw new Error(`Failed to fetch detailed coin data: ${coinInfoResponse.statusText}`);
          }

          const coinInfo = await coinInfoResponse.json();
          const coinName = coin.item.name;
          const coinPrice = coinInfo.market_data.current_price.usd;
          const priceChange24h = coinInfo.market_data.price_change_percentage_24h;

          // Categorize tokens based on price change
          const isHighRisk = priceChange24h > 0;

          return {
            name: coinName,
            price: coinPrice,
            price_change_percentage_24h: priceChange24h,
            strategy: isHighRisk ? 'High Risk Strategy' : 'Standard Strategy',
            risk_factors: isHighRisk ? [
              'Positive 24h price momentum',
              'High volatility potential',
              `${priceChange24h.toFixed(2)}% price increase in last 24h`
            ] : []
          };
        })
      );

      // Filter and organize the results
      const categorizedTokens = {
        high_risk_tokens: coinDetails.filter(coin => coin.strategy === 'High Risk Strategy'),
        other_tokens: coinDetails.filter(coin => coin.strategy !== 'High Risk Strategy'),
        summary: {
          total_tokens: coinDetails.length,
          high_risk_count: coinDetails.filter(coin => coin.strategy === 'High Risk Strategy').length,
          timestamp: new Date().toISOString()
        }
      };

      res.status(200).json(categorizedTokens);
    } else {
      res.status(404).json({ error: 'No coins data found' });
    }
  } catch (error) {
    console.error("Error fetching CoinGecko API:", error);
    
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error occurred' });
    }
  }
}