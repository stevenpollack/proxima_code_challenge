import * as clc from 'cli-color'

// our "atomic" type -- an order book has 2 Sides, and a
// Side is just Order[];
export type Order = [string, string];

// Order[] helper functions
function updateSide(side: Order[], diff: Order[], sortOrder: string): Order[] {
    diff.forEach(order => {
        const index = side.findIndex(val => order[0] === val[0]);
        if (index === -1) {
            side.push(order);
        } else {
            side[index] = order;
        }
        return
    })
    let newSide = side.filter(order => Number(order[1]) != 0);
    switch(sortOrder) {
        case 'asc':{
            newSide.sort((a,b) => Number(a[0]) - Number(b[0]));
            break;
        }
        case 'desc':{
            newSide.sort((a,b) => Number(b[0]) - Number(a[0]));
            break;
        }
        default: {
            newSide.sort();
            break;
        }
    }
    return newSide;
}

function calcAvgPrice(side: Order[], qty: number): number {
    let filledQty = 0;
    let avgPrice = 0;
    let orderIndx = 0;
    while (filledQty < qty) {
        const order = side[orderIndx];
        const price = Number(order[0]);
        const orderQty = Number(order[1]);
        if (orderQty + filledQty < qty) {
            avgPrice += price * (orderQty/qty);
            orderIndx++;
            filledQty += orderQty;
        } else {
            avgPrice += price * ((qty - filledQty) / qty)
            filledQty = qty;
        }
    }
    return avgPrice;
}

class Market {
    bids: Order[];
    asks: Order[];
}

export class OrderBook extends Market {
    lastUpdateId: number;
    avgBuy: number;
    avgSell: number;

    constructor(data: any) {
        super();
        this.lastUpdateId = data.lastUpdateId;
        this.asks = data.asks;
        this.bids = data.bids;
    }

    applyDiff(diff: Diff): void {
        this.lastUpdateId = diff.finalUpdateId;
        this.bids = updateSide(this.bids, diff.bids, 'desc');
        this.asks = updateSide(this.asks, diff.asks, 'asc');
    }

    calcAvgBuyAndSell(qty: number, output: boolean): void {
        this.avgBuy = calcAvgPrice(this.asks, qty);
        this.avgSell = calcAvgPrice(this.bids, qty)
        if (output) {
            this.writePriceToConsole();
        }
    }

    writePriceToConsole(): void {
        const bestBuyPrice = Number(this.asks[0][0]);
        const bestSellPrice = Number(this.bids[0][0]);
        process.stdout.write(clc.erase.line);
        process.stdout.write(clc.move.lineBegin);
        process.stdout.write(clc.green(`Buy: ${this.avgBuy.toFixed(2)} vs. ${bestBuyPrice}`));
        process.stdout.write(clc.white(` | `));
        process.stdout.write(clc.red(`Sell: ${this.avgSell.toFixed(2)} vs. ${bestSellPrice}`));
        process.stdout.write(clc.white(` | ${this.lastUpdateId}`));
    }
}

export class Diff extends Market {
    eventType: string;
    eventTime: number;
    symbol: string;
    firstUpdateId: number;
    finalUpdateId: number;

    constructor(data: any) {
        super();
        this.eventTime = data.E;
        this.eventType = data.e;
        this.symbol = data.s;
        this.firstUpdateId = data.u;
        this.finalUpdateId = data.U;
        this.bids = data.b;
        this.asks = data.a;
    }
}