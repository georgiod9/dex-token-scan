import axios from 'axios';
import { graphql, buildSchema } from 'graphql';
import fetch from "node-fetch";

import { Chain } from 'repeat';

import { ethers } from 'ethers';
import { Pool } from '@uniswap/v3-sdk'
import { Price, Token } from '@uniswap/sdk-core'
import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'

interface PoolObject {
    pool_id: string
    token0: Token
    token1: Token
}

interface PriceModel {
    token0: Token,
    token1: Token,
    token0Price: string,
    token1Price: string,
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
export class PoolHandler {

    pools_list: Array<PoolObject> = [];
    prices_list: Array<PriceModel> = [];

    //Get all Uniswap Pools
    //Set pools_list class variable
    async initialize() {
        const query = `
          {
            pools(first: 20, orderBy: volumeUSD, orderDirection: desc) {
              id
              token0{
                id
                name
                symbol
                decimals
              }
              token1 {
                id
                name
                symbol
                decimals
              }
            }
            
          }
        `
        try {
            const res = await fetch('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3', {
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

                    if (data.data.pools) {
                        const pools = data.data.pools;
                        //console.log("DATA RET: ", pools)
                        pools.forEach((pool: any) => {
                            //console.log("DATA RET: ", pool.token0.id)

                            const model: PoolObject = {
                                pool_id: pool.id,
                                token0: new Token(3, pool.token0.id, parseInt(pool.token0.decimals?.toString()), pool.token0.symbol?.toString(), pool.token0.name?.toString()),
                                token1: new Token(3, pool.token1.id, parseInt(pool.token1.decimals?.toString()), pool.token1.symbol?.toString(), pool.token1.name?.toString())
                            }
                            this.pools_list.push(model)
                        });
                    }

                    ////console.log("Pools List Initialized: ", this.pools_list)
                });
        }
        catch (e: any) {
            console.log(e)
        }
    }

    /*UNISWAP BOILERPLATE CODE START */
    async getPoolImmutables() {
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

    async getPoolState() {
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

    async readPoolInstance(
        poolObj: PoolObject

    ): Promise<Pool> {
        const [immutables, state] = await Promise.all([this.getPoolImmutables(), this.getPoolState()])

        const TokenA = poolObj.token0;

        const TokenB = poolObj.token1;

        const pool = new Pool(
            TokenB,
            TokenA,
            immutables.fee,
            state.sqrtPriceX96.toString(),
            state.liquidity.toString(),
            state.tick
        )
        //console.log(pool)

        return pool;
    }
    /*UNISWAP BOILERPLATE CODE END */

    //Set global variable prices_list
    setPricesList = (list: Array<PriceModel>) => {
        this.prices_list = list;
    }

    fetchTokenPools = (pools_list: PoolObject[]) => {
        const l: Array<PriceModel> = [];

        pools_list.forEach(pool => {
            poolContract = new ethers.Contract(pool.pool_id, IUniswapV3PoolABI, provider);
            //console.log("current pool instance: ", pool)
            //console.log("TOKEN0-: ", pool.token0.decimals, pool.token0)
            //console.log("TOKEN1-: ",  pool.token1.decimals,  pool.token1)

            try {
                const poolInstance = this.readPoolInstance(
                    pool
                );
                poolInstance.then((poolData) => {
                    
                    ////console.log("***POOL***")
                    //console.log("POOL ID: ", pool.pool_id)
                    //console.log(p)
                    ////console.log("->Pool Data")
                    //console.log("Uniswap Pools list: ", pools_list)
                    const token0Price = poolData.token0Price;
                    const token1Price = poolData.token1Price;
                    //console.log("Base Currency: ", token0Price)

                    const sqrtx96 = poolData.sqrtRatioX96;
                    const priceToken0 = token0Price.toSignificant(6)
                    //console.log("Price of token0 wrt token1: ", priceToken0)

                    const priceToken1 = token1Price.toSignificant(6)
                    //console.log(`Price of ${poolData.token1.symbol} wrt ${poolData.token0.symbol}: ${priceToken1}`)

                    let model: PriceModel = {
                        token0: poolData.token1,
                        token1: poolData.token0,
                        token0Price: priceToken0,
                        token1Price: priceToken1,
                    }

                    l.push(model)
                })
                    .then((data) => {
                        //console.log("CREATD LIST: ", l)
                        this.setPricesList(l);
                    })
            }
            catch (e: any) {
                console.log(e)
            }


        });


    }
}