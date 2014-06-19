/**
 * NOTE: RUNS IN THE CASPER ENVIRONMENT
 *
 * - for each project type (found on the page)
 *   - wait for the page to load
 *   - find something interesting
 *   - take a screenshot
 *
 * `this` is the casper object
 * name: the name of the exercise
 * seed: some pseudorandom number
 * dest: the folder to write files
 */

var getInterestingBox = require('./client/get-interesting-box.js');
var getNextKhanUrl = require('./client/get-next-khan-url.js');
var addProximaNova = require('./client/add-proxima-nova.js');

function casperKhan(name, seed, dest) {
    _loop.call(this, name, seed, dest, -1);
}

function _loop(name, seed, dest, index) {
    // Fix for Proxima Nova not being loaded on sandcastle.
    this.evaluate(addProximaNova);
    this.then(function() {
        // TODO(jared): be more clever about this. There's probably a selector
        // we can wait for...and the page usually loads in <2s, so we're
        // wasting time.
        this.waitForSelector('#problemarea');
    });
    this.then(function () {
        // Only screenshot if we've already found the first problem type
        if (index !== -1) {
            var filename = dest + '/' + name + '-' + index + '.png';
            this.echo('Capturing khan ' + name + ' ' + index + ' ' + filename);
            var box = this.evaluate(getInterestingBox, 256, 256);
            try {
                if (box) {
                    this.capture(filename, box);
                } else {
                    this.captureSelector(filename, "#problemarea");
                }
            } catch (e) {
                this.die("Failed to take a screenshot for " + name + ' ' + index + " : " + e.message);
            }
        }

        ++index;
        var nextUrl = this.evaluate(getNextKhanUrl, index, ++seed);

        if (!nextUrl) {
            console.log('No more Khan Exercises', name);
            this.emit('return', index);
            return;
        }

        this.open(nextUrl);
        this.then(function() {
            _loop.call(this, name, seed, dest, index);
        });
    });
}

module.exports = casperKhan;
