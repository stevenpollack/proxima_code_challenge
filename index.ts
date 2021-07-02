import WebSocket = require('ws');
import fetch = require('node-fetch');
import { OrderBook, Diff } from './OrderBook';

const ORDER_QTY = Number(process.argv[2]);
const TICKER = 'BTCUSDT'
const binanceSnapshot = `https://api.binance.com/api/v3/depth?symbol=${TICKER}&limit=10`;
const binanceWSS = `wss://stream.binance.com:9443/ws/${TICKER.toLowerCase()}@depth`;

let orderbook: OrderBook;
const ws = new WebSocket(binanceWSS);

ws.on('open', async function open() {
    console.log(`stream opened... calculating average buy & sell for ${ORDER_QTY} ${TICKER}:`);
    let response = await fetch(binanceSnapshot);
    orderbook = new OrderBook(await response.json());
});

ws.on('message', (wsData: WebSocket.Data) => {
    let data = JSON.parse(wsData.toString());
    if ( typeof orderbook === 'undefined' ||
        data.u <= orderbook.lastUpdateId ) {
        return;
    }
    
    const lastUpdateId = orderbook.lastUpdateId;
    const dataStraddlesSnapshot = 
        data.U <= lastUpdateId && lastUpdateId + 1 <= data.u;
    const dataLeadsSnapshot = lastUpdateId + 1 <= data.U;
    if (dataStraddlesSnapshot || dataLeadsSnapshot) {
        const diff = new Diff(data);
        orderbook.applyDiff(diff);
        orderbook.calcAvgBuyAndSell(ORDER_QTY, true);
    }

});