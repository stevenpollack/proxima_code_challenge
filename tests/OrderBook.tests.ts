import { assert, expect } from "chai";
import { updateSide, calcAvgPrice, Order } from "../OrderBook";

describe('updateSide method', () => {

    const side: Order[] = [
        ['10', '0.1'],
        ['11', '0.1'],
        ['12', '0.1'],
        ['13', '0.1'],
        ['14', '0.1']
    ];
    
    const diff: Order[] = [
        ['9', '1'],
        ['10', '0'],
        ['11', '0'],
        ['12', '1'],
        ['13', '1'],
        ['14', '1'],
    ]
    
    it('should remove prices with 0 volume and update volume', () => {
        const expected: Order[] = [
            ['9', '1'],
            ['12', '1'],
            ['13', '1'],
            ['14', '1'],
        ]

        const output = updateSide(side, diff, 'asc');
        expect(output).to.deep.equal(expected);
    });

    it('should be able to sort in descending order', () => {
        const expected: Order[] = [
            ['14', '1'],
            ['13', '1'],
            ['12', '1'],
            ['9', '1'],
        ]

        const output = updateSide(side, diff, 'desc');
        expect(output).to.deep.equal(expected);
    });
});

describe('calcAvgPrice', () => {
    const side: Order[] = [
        ['9', '1'],
        ['10', '1'],
        ['11', '1'],
        ['12', '1'],
        ['13', '1'],
        ['14', '1'],
    ]
    it('should return 0 when given 0 qty', () => {
        expect(calcAvgPrice(side,0)).to.equal(0);
    })
    it('should return the correct value', () => {
        expect(calcAvgPrice(side, 1)).to.equal(9);
        expect(calcAvgPrice(side, 2)).to.equal(9.5);
        expect(calcAvgPrice(side, 6)).to.equal(11.5);
    })
    it('should throw an error when side does not have enough depth', () => {
        const badFn = function() {calcAvgPrice(side, 6.1);};
        expect(badFn).to.throw(Error, 'depth');
    })
})
