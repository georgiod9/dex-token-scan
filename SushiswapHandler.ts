import { Token } from "@uniswap/sdk-core";
import fetch from "node-fetch";
import { PoolHandler } from "./PoolHandler";

interface SushiswapToken {
    id: string,
    symbol: string,
}

interface SushiswapPriceModel {
    id: string,
    token0: SushiswapToken,
    token1: SushiswapToken,
    token0Price: string,
    token1Price: string,

}

interface PriceModel {
    token0: string,
    token1: string,
    price: string
}

interface UniPriceModel {
    token0: Token,
    token1: Token,
    token0Price: string,
    token1Price: string,
}

interface ExchangePrice {
    name: string,
    token0Price: string,
    token1Price: string
}

interface SushiswapPairs {
    id: string,
    token0: SushiswapToken,
    token1: SushiswapToken,
    token0Price: string,
    token1Price: string

}

interface ExchangePairs {
    id: string,
    token0: SushiswapToken,
    token1: SushiswapToken,
    exchange0: ExchangePrice,
    exchange1: ExchangePrice,

}

const poolHandler = new PoolHandler();

export class SushiswapHandler {
    pairs: Array<PriceModel> = [];
    prices_list: Array<SushiswapPriceModel> = [];
    common_uniswap_pairs: Array<SushiswapPairs> = [];
    mutual_exchange_pairs: Array<ExchangePairs> = [];

    setPairs = (list: Array<SushiswapPriceModel>) => {
        const model: PriceModel = {
            token0: "",
            token1: "",
            price: ""
        }
        list.forEach((element, index) => {
            model.token0 = element.token0.symbol;
            model.token1 = element.token1.symbol;
            model.price = element.token1Price;
            this.pairs[index] = model;
        })


    }
    getSushiswapPair = async (index: number, token0: string, token1: string) => {
        console.log(`Fetching sushiswap pair using token0: ${token0} and token1: ${token1} ...`)
        const query =
            `query getPair($token0: String = "${token1.toLowerCase()}", $token1: String = "${token0.toLowerCase()}"){
            pairs(where: {token0: $token0, token1:$token1}) {
                id
                    token0 {
                  id
                  symbol
                }
                    token1 {
                      id
                      symbol
                    }
                    token0Price
                    token1Price
            }
        }`



        const res = await fetch('https://api.thegraph.com/subgraphs/name/sushiswap/exchange', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query
            })
        })
        //.then((response) => response.json())
        //.then(data => {

        // model.id = data.data.pairs[0].id;
        //model.token0 = data.data.pairs[0].token0;
        //model.token1 = data.data.pairs[0].token1;


        //this.common_uniswap_pairs.push(model);
        //console.log(`----Matching #${index}----`)
        //console.log(JSON.stringify(data.data.pairs[0]))



        // })


        return res;
    }

    getCommonPairs = (uniswapTokens: Array<UniPriceModel>) => {
        //console.log("Find Common with Uni: ", uniswapTokens)
        console.log("Finding common pairs between uniswap and sushiswap...")

        uniswapTokens.forEach((element, index) => {
            const matchPair = this.getSushiswapPair(index, element.token0.address.toString(), element.token1.address.toString())
            matchPair.then((response) => response.json())
                .then(data => {

                    console.log("**********TESTING***********")
                    //console.log(JSON.stringify(data.data.pairs[0]))

                    const model: ExchangePairs = {
                        id: data.data.pairs[0].id,
                        token0: {
                            id: data.data.pairs[0].token0.id,
                            symbol: data.data.pairs[0].token0.symbol,
                        },
                        token1: {
                            id: data.data.pairs[0].token1.id,
                            symbol: data.data.pairs[0].token1.symbol,
                        },
                        exchange0: {
                            name: 'susiswap',
                            token0Price: data.data.pairs[0].token0Price,
                            token1Price: data.data.pairs[0].token1Price,
                        },
                        exchange1: {
                            name: "uniswap",
                            token0Price: element.token0Price,
                            token1Price: element.token1Price,
                        },
                    }

                    console.log("-------> Created Model: ")
                    console.log(model)
                    this.mutual_exchange_pairs.push(model);

                })

            /*
            setTimeout(() => {
                console.log("LIST NOW: ", this.common_uniswap_pairs)
            },1000);


            const model: SushiswapPairs = {
                        id: data.data.pairs[0].id,
                        token0: {
                            id: data.data.pairs[0].token0.id,
                            symbol: data.data.pairs[0].token0.symbol,
                        },
                        token1: {
                            id: data.data.pairs[0].token1.id,
                            symbol: data.data.pairs[0].token1.symbol,
                        },
                        exchange0: {
                            name: 'susiswap',
                            token0Price: data.data.pairs[0].token0Price,
                            token1Price: data.data.pairs[0].token1Price,
                        },
                        exchange1: {
                            name: "uniswap",
                            token0Price: "",
                            token1Price: "",
                        },
                    
                    }

            */
        })
        return this.mutual_exchange_pairs
    }

    getSushiswapPairs = async () => {
        //query sushiswap for tokens ordered by volumeUSD descending
        const query =
            `{
                pairs(first: 20, orderBy: volumeUSD, orderDirection: desc) {
                    id
                    token0 {
                      id
                      name
                      symbol
                    }
                
                    token1 {
                    id
                    name
                    symbol
                    
                    }
                  token0Price
                  token1Price
                }
            }`

        try {
            const res = await fetch('https://api.thegraph.com/subgraphs/name/sushiswap/exchange', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query
                })
            })
                .then(async (res) => {
                    console.log("((((((((((((", res)
                    res.json().then((res) => {
                        console.log("DAT ", res.data)

                        this.setPairs(res.data.pairs)
                        console.log("global ", this.pairs)
                    })
                })

        } catch (e: any) {
            console.log(e)
        }
    }

    getSushiswapPriceModel = () => {
        if (this.pairs) {
            let array = this.pairs;


            let pairs = this.pairs
            console.log("data; ", pairs)

            pairs.forEach((element, index) => {
                console.log("*************")
                console.log(element)
                //element.json().then((d) => console.log(d))
            })

        }

    }
}