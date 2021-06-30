# Binance Local Order Book
This task requires you to create a local order book that replicates the Binance order book. To accomplish this task you will need to refer to the Binance documentation to understand the structure of the order book updates messages.
 
 ### Resources & Tooling Allowed
 - [Binance Diff Depth Stream](https://github.com/binance-exchange/binance-official-api-docs/blob/master/web-socket-streams.md#diff-depth-stream)
 - [How to manage a local order book correctly](https://github.com/binance-exchange/binance-official-api-docs/blob/master/web-socket-streams.md#how-to-manage-a-local-order-book-correctly)
 - Websocket library of your choosing
 - Binance related libraries are not allowed
 - Data structure imports are allowed, if you do use one please explain your choice
 - Take a look at [Binance's BTCUSDT Interface](https://www.binance.com/en/trade/USDC_USDT)
 - Reach out with any questions
 
 ### Requirements
 You are required to create a local copy of the Binance's BTCUSDT market. This local copy will be used to compute weighted buy and sell prices. Your app will need to accept an argument for the quantity of BTC to use for the weighted pricing. With that argument, you are to produce an average execution price to buy or sell the aforementioned quantity of Bitcoin. You should display this price on the console, preferably overwriting the previous line (instead of just appending a new line to console).

 The idea behind the average execution price is that it should tell the user what the average price would be for their given order size at any point in time. The reason this is useful is that the larger the trade in a financial market, the more slippage there will be and thus the worse the average price will be for the user. In this sense, the average execution price is the true price for the user, more so than just the best buy and sell prices.
 
 You are free to implement your solution as you see fit as long as it is accurate. We define accuracy as correctly outputting the correct average prices to console.

### Grading
Incorrect solutions will be given feedback, and a chance to fix their implementations. Once a correct solution has been submitted it will be graded based primarily on code-style. There will be the opportunity to score bonus points for performance, however, the primary objective is to develop correct and maintainable code - exhibiting a strong understanding of OO and general programming principles. Your solution should be maximally extendable and maintainable with a logical separation of classes and responsibilities. One way to judge maintainability and extensibility is to ask yourself `"how difficult would it be to add another exchange?"`.
