import axios from 'axios';
import { graphql, buildSchema } from 'graphql';
import fetch from "node-fetch";

import { Chain } from 'repeat';

import { ethers } from 'ethers';
import { Pool } from '@uniswap/v3-sdk'
import { Price, Token } from '@uniswap/sdk-core'
import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'


import { PoolHandler } from './PoolHandler';
import { SushiswapHandler } from './SushiswapHandler';
import express from "express"


let chain = new Chain();
let init = new Chain();
let poolHandler = new PoolHandler();
let sushiswapHandler = new SushiswapHandler();

const app = express();

app.listen(3000)

app.get('/getUniswapTokens', (req, res) => {
  getUniswapPriceList();
  console.log("Must return: ", poolHandler.prices_list)
  res.json({
    prices_list: poolHandler.prices_list
  })
})

app.get('/getSushiswapTokens', (req, res) => {
  sushiswapHandler.getSushiswapPairs();
  setTimeout(() => {
    res.json({
      pairs: sushiswapHandler.pairs
    })

    sushiswapHandler.getSushiswapPriceModel();

  }, 4000);

})

app.get('/getCommonPairs', (req, res) => {
  getUniswapPriceList();
  setTimeout(() => {
    const exPairs = sushiswapHandler.getCommonPairs(poolHandler.prices_list)
    setTimeout(() => {
      console.log("#######EXCHANGE PAIRS###########")
      console.log(exPairs)
      //console.log("RETURNEWD: ", sushiswapHandler.common_uniswap_pairs)
      res.json({
        common_pairs: exPairs
      })
    }, 3000);
  }, 2000);
})

//getAllUniswapPools()
init.add(
  () => {
    //fetch uniswap pools
    poolHandler.initialize()
  }
).once()

function getUniswapPriceList() {
  console.log("Fetching 2 uniswap tokens")
  if (poolHandler.pools_list) {
    console.log("Pool list populated...")
    //console.log("Uniswap pools: ", pools_list[0])
    //console.log("Fetched Uniswap Pools :", pools_list)

    //Set public variable "prices_list"
    poolHandler.fetchTokenPools(poolHandler.pools_list);
    setTimeout(() => {
      ///console.log("Set global price list: ", poolHandler.prices_list)

      poolHandler.prices_list.forEach((element, index) => {
        ////console.log(`Pool ${index} details: ${element.token0.symbol}/${element.token1.symbol} -> ${element.token1Price}`)
      })

    }, 5000);

  }
}

setTimeout(() => {
  const test = getUniswapPriceList()
  console.log("FINAL: ", test)
}, 1000);


chain
  .add(
    () => {
      //main()
    }

  )
  .every(20000)
  .forever





