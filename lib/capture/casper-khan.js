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

var getInterestingBox;
var getNextKhanUrl;
var addProximaNova;

try {
    getInterestingBox = require('./client/get-interesting-box.js');
    getNextKhanUrl = require('./client/get-next-khan-url.js');
    addProximaNova = require('./client/add-proxima-nova.js');
} catch (e) { // freaking cross platformity
    getInterestingBox = require('./lib/capture/client/get-interesting-box.js');
    getNextKhanUrl = require('./lib/capture/client/get-next-khan-url.js');
    addProximaNova = require('./lib/capture/client/add-proxima-nova.js');
}

function casperKhan(name, seed, dest) {
    _loop.call(this, name, seed, dest, -1);
}

function _loop(name, seed, dest, index) {
    // Fix for Proxima Nova not being loaded on sandcastle.
    this.evaluate(addProximaNova);
    this.then(function() {
        this.waitForSelector('#problemarea', function then() {
            shoot.call(this, name, seed, dest, index);
        }, function onTimeout() {
            this.echo('trying again');
            this.reload(function () {
                this.waitForSelector('#problearea', function then() {
                    shoot.call(this, name, seed, dest, index);
                }, function onTimeout() {
                    this.die('Problem area did not appear ' + name + ':' + seed + ':' + dest);
                }, 30000);
            });
        }, 30000); // can also add a timeout param
    });
}

function shoot(name, seed, dest, index) {
    this.wait(2000, function () {
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
            console.log('No more Khan Exercises', name, 'found', index);
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
