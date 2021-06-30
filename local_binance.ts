import * as WebSocket from 'ws';
import fetch from 'node-fetch'

interface Diff {
    "event": string;
    "eventTime": number;
    "symbol": string;
    "firstUpdateId": number;
    "finalUpdateId": number;
    "bids": Array<Array<string>>;
    "asks": Array<Array<string>>;
}

const TICKER = 'btcusdt';
const LEVEL = ''//5;
const SPEED = '1000ms';
const ORDER_QUANTITY = 1

class OrderBook {
    lastUpdateId: number;
    finalUpdateId: number;
    bids: Array<Array<string>>;
    asks: Array<Array<string>>;

    constructor(snapshot) {
        this.bids = snapshot.bids;
        this.asks = snapshot.asks;
        this.lastUpdateId = snapshot.lastUpdateId;
    };

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
          // clean up: filter out empty prices and sort
          this[side] = this[side].filter(([price, quantity]) => Number(quantity) > 0)
                        .sort((a, b) => side === 'asks' ? a[0] > b[0] : b[0] > a[0])
        })
    }

    calculateAverageOrderPrice (orderQty: number) {
        orderQty = orderQty || ORDER_QUANTITY;
        const sides = ['bids', 'asks'];
        sides.forEach(side => {
          let currentQty = 0
          let index = 0
          let filledOrder = []
          let averagePrice = 0
          while(currentQty < orderQty) {
            const remainingQty = orderQty - currentQty
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
            averagePrice += fillPrice * (fillQuantity / orderQty);
          })
          
          console.log(side === 'bids' ? 'Sell' : 'Buy', filledOrder, averagePrice)
          // if (currentOrderQuantity <= quantity) { shiftArray } 
        })
    }
}

function diffMapper (stream: any): Diff {
  const data = JSON.parse(stream)
  return {
    "event": data.e,
    "eventTime": data.E,
    "symbol": data.s,
    "firstUpdateId": data.U,
    "finalUpdateId": data.u,
    "bids": data.b,
    "asks": data.a
  }
}



function processDiffStream (orderBook, diff: Diff) {
  if (diff.finalUpdateId <= orderBook.lastUpdateId) {
    return
  }
  if (diff.firstUpdateId <= (orderBook.lastUpdateId + 1) && diff.finalUpdateId >= (orderBook.lastUpdateId + 1)) {
    // this is our first event, we need to get the orderBook up to date
    // console.log('tick', diff.firstUpdateId, orderBook.lastUpdateId + 1, diff.finalUpdateId)
    // console.log(diff)
    orderBook.applyDiff(diff)
    orderBook.calculateAverageOrderPrice();
    // processSide(orderBook.bids, 0, ORDER_QUANTITY)
    // processSide(orderBook.asks, 0, ORDER_QUANTITY)
    // console.log(orderBook)
  }

  if (orderBook.finalUpdateId && orderBook.finalUpdateId + 1 === diff.firstUpdateId) {
    // we are in the stream now
    // console.log('tock', orderBook.finalUpdateId, diff.firstUpdateId, diff.finalUpdateId)
    orderBook.applyDiff(diff)
    orderBook.calculateAverageOrderPrice();
  }
}

let testBids =     [
    [ '34833.20000000', '0.28984100' ],
[ '34833.62000000', '0.08612400' ],
[ '34833.63000000', '0.02300000' ],
[ '34834.08000000', '0.31783900' ],
[ '34834.14000000', '0.23110000' ],
[ '34834.44000000', '0.31709000' ],
[ '34834.57000000', '0.02996500' ]]

function processSide(side, filledQty, remainingQty) {
    const topBid = side.shift();
    if (!topBid) {
        return 0;
    }
    let bidPrice = Number(topBid[0]);
    let bidQty = Number(topBid[1]);
    if (bidQty < remainingQty) {
        return bidQty*bidPrice + processSide(side, filledQty + bidQty, remainingQty - bidQty)
    } else if (bidQty > remainingQty) {
        side.unshift([bidPrice, bidQty - remainingQty])
        return bidPrice * remainingQty;
    } else {
        return bidQty*bidPrice;
    }
}

// 1.2949590



async function Main() {
  const binanceWebSocket = `wss://stream.binance.com:9443/ws/${TICKER}@depth${LEVEL}@${SPEED}`;
  const ws = new WebSocket(binanceWebSocket);
  const response = await fetch(`https://api.binance.com/api/v3/depth?symbol=${TICKER.toUpperCase()}&limit=1000`);
  const orderBook = new OrderBook(await response.json());
  const { lastUpdateId } = orderBook;
  // console.log('start', orderBook.lastUpdateId);
  ws.on('message', data => {
    const diff = diffMapper(data)
    processDiffStream(orderBook, diff)
  })
  // console.log(processSide(testBids, 0, 1));
  // console.log(calculateAverageOrderPrice({ bids: testBids }))
}

Main()