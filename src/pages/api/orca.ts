// import { NextApiRequest, NextApiResponse } from 'next';
// import { fetchWhirlpoolsByTokenPair, setWhirlpoolsConfig } from '@orca-so/whirlpools';
// import { createSolanaRpc, devnet, address } from '@solana/web3.js';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//     try {
//       // Configure the Whirlpool environment
//       await setWhirlpoolsConfig('solanaDevnet');
//       const devnetRpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));
  
//       // Token mint addresses
//       const tokenMintOne = address("So11111111111111111111111111111111111111112");
//       const tokenMintTwo = address("BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k");
  
//       // Fetch pools for the token pair
//       const poolInfos = await fetchWhirlpoolsByTokenPair(devnetRpc, tokenMintOne, tokenMintTwo);
//       const initializedPools = poolInfos.filter(pool => pool.initialized);
  
//       // Calculate APY for each pool
//       const poolsWithAPY = initializedPools.map(pool => {
//         const feeRevenueA = Number(pool.feeGrowthGlobalA) / Number(pool.liquidity || 1);
//         const feeRevenueB = Number(pool.feeGrowthGlobalB) / Number(pool.liquidity || 1);
  
//         const rewardRevenue = pool.rewardInfos.reduce((sum, rewardInfo) => {
//           const emissionsPerSecond = Number(rewardInfo.emissionsPerSecondX64) / (2 ** 64);
//           return sum + (emissionsPerSecond * 86400); // Daily reward in tokens
//         }, 0);
  
//         const apy = ((feeRevenueA + feeRevenueB + rewardRevenue) / Number(pool.liquidity || 1)) * 365;
//         return { address: pool.address, apy };
//       });
  
//       // Sort pools by APY
//       const sortedPools = poolsWithAPY.sort((a, b) => b.apy - a.apy);
  
//       // Return the result as JSON
//       res.status(200).json({ pools: sortedPools });
//     } catch (error) {
//       // Narrowing the type of 'error'
//       if (error instanceof Error) {
//         console.error("Error fetching whirlpools:", error.message);
//         res.status(500).json({ error: 'Internal Server Error', details: error.message });
//       } else {
//         console.error("Unknown error:", error);
//         res.status(500).json({ error: 'Internal Server Error', details: 'An unknown error occurred' });
//       }
//     }
//   }
  