import * as clc from 'cli-color'

export class Market {
    bids: Array<Array<string>>;
    asks: Array<Array<string>>;
}

export class Diff extends Market {
    event: string;
    eventTime: number;
    symbol: string;
    firstUpdateId: number;
    finalUpdateId: number;

    constructor (stream: any) {
        super();
        const data = JSON.parse(stream)
        this.event = data.e
        this.eventTime = data.E
        this.symbol = data.s
        this.firstUpdateId = data.U
        this.finalUpdateId = data.u
        this.bids = data.b
        this.asks = data.a
    }
}

export class OrderBook extends Market{
    
    lastUpdateId: number;
    finalUpdateId: number;
    orderQty: number;
    
    constructor(snapshot, orderQty) {
        super();
        this.bids = snapshot.bids;
        this.asks = snapshot.asks;
        this.lastUpdateId = snapshot.lastUpdateId;
        this.orderQty = orderQty
    };
    
    writePrices(sell, buy, txTime) {
        process.stdout.write(clc.erase.line);
        process.stdout.write(clc.move.lineBegin);
        process.stdout.write(clc.red("Sell price: " + sell));
        process.stdout.write(`  |  `);
        process.stdout.write(clc.green("Buy price: " + buy));
        process.stdout.write(`  |  ${txTime}`);
    }

    applyDiff(diff: Diff) {
        this.finalUpdateId = diff.finalUpdateId;
        const sides = ['bids', 'asks'];
        sides.forEach(side => {
          diff[side].forEach(([price, quantity]) => {
            const index = this[side].findIndex(([bookPrice, bookQuantity]) => price === bookPrice)
            if (index > -1) {
              // this bid exists and needs to be updated
                this[side][index] = [price, quantity]; 
            } else {
              // bid is new and needs to be inserted
              this[side].push([price, quantity])
            }
          })
          // clean up: filter out empty prices and sort such that largest bid and smallest ask
          // are at the end of their arrays.
          this[side] = this[side].filter(([price, quantity]) => Number(quantity) > 0);
          this[side].sort((a, b) =>  {
            const prevPrice = Number(a[0])
            const nextPrice = Number(b[0])
            if (side === 'bids') {
              return nextPrice - prevPrice
            } else {
              return prevPrice - nextPrice;
            }
            // side === 'asks' ? b[0] > a[0] : b[0] < a[0]
          });
        })
    }

    calcAvgPrice () {
        const sides = ['bids', 'asks'];
        const avgPrices = { bids: 0, asks: 0}
        sides.forEach(side => {
          let currentQty = 0
          let index = 0
          let filledOrder = []
          let averagePrice = 0
          while(currentQty < this.orderQty) {
            const remainingQty = this.orderQty - currentQty
            const [bookPrice, bookQty] = this[side][index]
            if (Number(bookQty) > remainingQty) {
              currentQty += remainingQty
              filledOrder.push([Number(bookPrice), remainingQty])
            } else if (Number(bookQty) <= remainingQty) {
              index++
              currentQty += Number(bookQty)
              filledOrder.push([Number(bookPrice), Number(bookQty)])
            }
          }
          filledOrder.forEach(([fillPrice, fillQuantity]) => {
            averagePrice += fillPrice * (fillQuantity / this.orderQty);
          })
          avgPrices[side] = averagePrice
        })
        this.writePrices(avgPrices.bids, avgPrices.asks, this.finalUpdateId)
    }

    processDiff (diff: Diff) {
        if (diff.finalUpdateId <= this.lastUpdateId) {
          return
        }
        const beginStream = diff.firstUpdateId <= (this.lastUpdateId + 1) && diff.finalUpdateId >= (this.lastUpdateId + 1);
        const inStream = this.finalUpdateId && this.finalUpdateId + 1 === diff.firstUpdateId;
        if (beginStream || inStream) {
          this.applyDiff(diff)
          this.calcAvgPrice();
        }
    }

    recursiveProcess(side: Array<Array<string>>, filledQty: number, remainingQty: number) {
        if (side.length === 0) {
            return 0;
        }
        const topBid = side.pop();
        let bidPrice = Number(topBid[0]);
        let bidQty = Number(topBid[1]);
        if (bidQty < remainingQty) {
            return bidQty*bidPrice + this.recursiveProcess(side, filledQty + bidQty, remainingQty - bidQty)
        } else if (bidQty > remainingQty) {
            side.push([bidPrice.toString(), (bidQty - remainingQty).toString()])
            return bidPrice * remainingQty;
        } else {
            return bidQty*bidPrice;
        }
    }
}