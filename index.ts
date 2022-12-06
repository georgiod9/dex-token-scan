import axios from 'axios';
import { graphql, buildSchema } from 'graphql';
import fetch from "node-fetch";

import { Chain } from 'repeat';

import { ethers } from 'ethers';
import { Pool } from '@uniswap/v3-sdk'
import { Price, Token } from '@uniswap/sdk-core'
import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'


interface PoolObject {
  pool_id: String
  token0: Token
  token1: Token
} 

let chain = new Chain();
let init = new Chain();



let pools_list: Array<PoolObject>= [];
//const setPoolsList = (data: Array<JSON>) => {
//  pools_list = data;
////  console.log("Pool list variable: ", pools_list[0])
//}

init.add(
  () => {
    getAllUniswapPools()
    
    
  }
)
.once()


//Get all Uniswap Pools
async function  getAllUniswapPools(){
  const query = `
    {
      pools(first: 10) {
        id
        token0{
          id
          name
          symbol
        }
        token1 {
          id
          name
          symbol
        }
      }
      
    }
  `
  const res = fetch('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query
    })
  })
  .then(r => r.json())
  .then(data => {
    //console.log('data returned: ', data.data.pools[0]);
    //setPoolsList(data.data.pools);

    const pools = data.data.pools;
    //console.log("DATA RET: ", pools)
    pools.forEach((pool: any) => {
      const model: PoolObject = {
        pool_id: pool.id,
        token0: pool.token0,
        token1: pool.token1
      }
      pools_list.push(model)
    });
    //console.log("ARRAY FINAL: ", pools_list)
  });

  
}


const RPC_URL = "https://mainnet.infura.io/v3/f05a65a5615f46109508de2f691dead3";
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const poolAddress = '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8';
let poolContract = new ethers.Contract(poolAddress, IUniswapV3PoolABI, provider);

interface Immutables {
  factory: string
  token0: string
  token1: string
  fee: number
  tickSpacing: number
  maxLiquidityPerTick: ethers.BigNumber
}

interface State {
  liquidity: ethers.BigNumber
  sqrtPriceX96: ethers.BigNumber
  tick: number
  observationIndex: number
  observationCardinality: number
  observationCardinalityNext: number
  feeProtocol: number
  unlocked: boolean
}

async function getPoolImmutables() {
  const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] = await Promise.all([
    poolContract.factory(),
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
    poolContract.tickSpacing(),
    poolContract.maxLiquidityPerTick(),
  ])

  const immutables: Immutables = {
    factory,
    token0,
    token1,
    fee,
    tickSpacing,
    maxLiquidityPerTick,
  }
  return immutables
}

async function getPoolState() {
  const [liquidity, slot] = await Promise.all([poolContract.liquidity(), poolContract.slot0()])

  const PoolState: State = {
    liquidity,
    sqrtPriceX96: slot[0],
    tick: slot[1],
    observationIndex: slot[2],
    observationCardinality: slot[3],
    observationCardinalityNext: slot[4],
    feeProtocol: slot[5],
    unlocked: slot[6],
  }

  return PoolState
}

async function readPoolInstance(): Promise<Pool> {
  const [immutables, state] = await Promise.all([getPoolImmutables(), getPoolState()])

  const TokenA = new Token(3, immutables.token0, 6, 'USDC', 'USD Coin')

  const TokenB = new Token(3, immutables.token1, 18, 'WETH', 'Wrapped Ether')

  const pool = new Pool(
    TokenA,
    TokenB,
    immutables.fee,
    state.sqrtPriceX96.toString(),
    state.liquidity.toString(),
    state.tick
  )
  //console.log(pool)

  return pool;
}

chain
  .add(
    () => {
      if(pools_list) {
        //console.log("Uniswap pools: ", pools_list[0])
        //console.log("Fetched Uniswap Pools :", pools_list)

        pools_list.forEach(pool => {
          //poolContract = new ethers.Contract(pool.id, IUniswapV3PoolABI, provider);
          //console.log("current pool instance: ", pool)
          const poolInstance = readPoolInstance(
            
          );
          poolInstance.then((poolData) => {

            console.log("***POOL***")
            //console.log(p)
            console.log("->Pool Data")
            console.log("Uniswap Pools list: ", pools_list)
            const token0Price = poolData.token0Price;
            const token1Price = poolData.token1Price;
            //console.log("Base Currency: ", token0Price)
          
            const sqrtx96 = poolData.sqrtRatioX96;
            const priceToken0 = token0Price.toSignificant(6)
            //console.log("Price of token0 wrt token1: ", priceToken0)
  
            const priceToken1 = token1Price.toSignificant(6)
            console.log(`Price of ${poolData.token1.symbol} wrt ${poolData.token0.symbol}: ${priceToken1}`)
  
          })
        });

        
        
      }

    }
  )
  .every(2000)
  .forever





