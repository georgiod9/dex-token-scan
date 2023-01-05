import fetch from "node-fetch";

interface SushiToken {
    id: string,
    name: string,
    symbol: string,
}

interface SushiswapPriceModel {
    id: string,
    token0: SushiToken,
    token1: SushiToken,
    token0Price: string,
    token1Price: string,

}

interface PriceModel {
    token0: string,
    token1: string,
    price: string
}

export class SushiswapHandler {
    pairs: Array<PriceModel> = [];
    prices_list: Array<SushiswapPriceModel> = [];

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
    getSushiswapPairs = async () => {
        //query sushiswap for tokens ordered by volumeUSD descending
        const query =
            `{
                pairs(first: 10, orderBy: volumeUSD, orderDirection: desc) {
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