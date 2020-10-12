const assert = require('assert');
const IntervalTree = require('@flatten-js/interval-tree').default;
const Interval = require('@flatten-js/interval-tree').Interval;

class RangeList {
    constructor() {
        this.intervalTree = new IntervalTree();
    }

    add(range) {
        if (!this.validateRange(range))
            throw Error("Invalid Parameter: range")
        range[0] = parseInt(range[0])
        range[1] = parseInt(range[1])

        let overlappedIntervals = this.intervalTree.search(range);
        if (overlappedIntervals.length === 0)
            this.intervalTree.insert(range)
        else {
            let newInterval = new Interval(range[0], range[1])
            overlappedIntervals.forEach((value) => {
                let existInterval = new Interval(value[0], value[1])
                newInterval = newInterval.merge(existInterval)
                this.intervalTree.remove(value)
            })

            this.intervalTree.insert([newInterval.low, newInterval.high])
        }
    }

    /**
     * Removes a range from the list
     * @param {Array<number>} beginning and end of range.
     */
    remove(range) {
        if (!this.validateRange(range))
            throw Error("Invalid Parameter: range")
        range[0] = parseInt(range[0])
        range[1] = parseInt(range[1])
        if (range[0] == range[1])
            return

        let overlappedIntervals = this.intervalTree.search(range);

        let removingInterval = range;
        overlappedIntervals.forEach((value) => {
            this.intervalTree.remove(value)
            this.diffInterval(value, removingInterval).forEach((v) => {
                this.intervalTree.insert(v)
            })
        })
    }

    /**
     * Prints out the list of ranges in the range list
     */
    print() {
        console.log(this.intervalTree.keys)
    }

    //Validate the range parameter
    //Range should be like this [low, high] format
    validateRange(range) {
        if (!range)
            return false
        if (!Array.isArray(range))
            return false
        if (range.length !== 2)
            return false
        if (isNaN(parseInt(range[0])) || isNaN(parseInt(range[1])))
            return false
        if (range[0] > range[1])
            return false
        return true
    }

    // Compute range1 - range2 
    // e.g. [1,10] - [2,3] = [[1,2],[3,10]]
    // e.g. [1,10] - [-1,3] = [[3,10]]
    // e.g. [1,10] - [-2,11] = []
    diffInterval(inteval, toRemove) {
        if (!this.validateRange(inteval) || !this.validateRange(toRemove))
            throw Error("Invalid Parameter: range")
        if (toRemove[0] == toRemove[1])
            return [inteval]

        if (toRemove[0] <= inteval[0] && toRemove[1] >= inteval[1])
            return []

        if (toRemove[0] > inteval[0] && toRemove[1] < inteval[1])
            return [
                [inteval[0], toRemove[0]],
                [toRemove[1], inteval[1]]
            ]

        if (toRemove[1] >= inteval[0] && toRemove[1] < inteval[1])
            return [
                [toRemove[1], inteval[1]]
            ]
        if (toRemove[0] <= inteval[1]) {
            return [
                [inteval[0], toRemove[0]]
            ]
        }
    }
}
//tests add 
var rl = new RangeList()

rl.add([1, 5]);
rl.print();
// Should display: [1, 5)

rl.add([10, 20]);
rl.print();
// Should display: [1, 5) [10, 20)

rl.add([20, 20]);
rl.print();
// Should display: [1, 5) [10, 20)


rl.add([20, 21]);
rl.print();
// // Should display: [1, 5) [10, 21)

rl.add([2, 4]);
rl.print();
// Should display: [1, 5) [10, 21)

rl.add([3, 8]);
rl.print();
// Should display: [1, 8) [10, 21)

//tests remove
rl.remove([10, 10]);
rl.print();
// Should display: [1, 8) [10, 21)
rl.remove([10, 11]);
rl.print();
// Should display: [1, 8) [11, 21)
rl.remove([15, 17]);
rl.print();
// Should display: [1, 8) [11, 15) [17, 21)
rl.remove([3, 19]);
rl.print();
// Should display: [1, 3) [19, 21)


//test helper validateRange
assert(rl.validateRange([]) === false)
assert(rl.validateRange() === false)
assert(rl.validateRange(233) === false)
assert(rl.validateRange('a') === false)
assert(rl.validateRange(["a", "b"]) === false)
assert(rl.validateRange([1, 2, 3]) === false)
assert(rl.validateRange([3, 2]) === false)
assert(rl.validateRange([2, 2]) === true)
assert(rl.validateRange([1, 2]) === true)

//only for testing diffInterval
let compareRangeDiff = (arrayA, arrayB) => {
    if (arrayA.length !== arrayB.length) return false;

    for (let i = 0; i < arrayA.length; ++i) {
        if (arrayA[i].length !== arrayB[i].length) return false;
        for (let j = 0; j < arrayA[i].length; ++j) {
            if (arrayA[i][j] !== arrayB[i][j])
                return false
        }
    }
    return true
}

//testing diffInterval
assert(compareRangeDiff(rl.diffInterval([0, 1], [1, 1]), [
    [0, 1]
]))
assert(compareRangeDiff(rl.diffInterval([0, 1], [-1, 0]), [
    [0, 1]
]))

assert(compareRangeDiff(rl.diffInterval([-9, 10], [0, 9]), [
    [-9, 0],
    [9, 10]
]))
assert(compareRangeDiff(rl.diffInterval([-9, 10], [9, 10]), [
    [-9, 9]
]))
assert(compareRangeDiff(rl.diffInterval([-9, 10], [-10, 10]), []))
assert(compareRangeDiff(rl.diffInterval([-9, 10], [-9, -9]), [
    [-9, 10]
]))
assert(compareRangeDiff(rl.diffInterval([-9, 10], [-10, -9]), [
    [-9, 10]
]))
assert(compareRangeDiff(rl.diffInterval([-9, 10], [10, 12]), [
    [-9, 10]
]))