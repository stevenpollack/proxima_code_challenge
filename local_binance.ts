import * as WebSocket from 'ws';
import fetch from 'node-fetch'
import { OrderBook, Diff } from './models';

const ORDER_QUANTITY = Number(process.argv[2]) || 0.1
const TICKER = 'BTCUSDT';
const SPEED = '100ms';

async function Main() {
  const binanceWebSocket = `wss://stream.binance.com:9443/ws/${TICKER.toLowerCase()}@depth@${SPEED}`;
  const ws = new WebSocket(binanceWebSocket);
  let orderBook;
  let previousDiffs = []
  
  ws.on('message', async function (data) {
    const diff = new Diff(data);
    if (typeof orderBook === 'undefined') {
      previousDiffs.push(diff)
      const response = await fetch(`https://api.binance.com/api/v3/depth?symbol=${TICKER}&limit=1000`);
      orderBook = new OrderBook(await response.json(), ORDER_QUANTITY);
      return;
    }
    if (previousDiffs.length) {
      previousDiffs.forEach(prevDiff => orderBook.processDiff(prevDiff))
      previousDiffs = []
    }
    orderBook.processDiff(diff);
  })
}

Main()