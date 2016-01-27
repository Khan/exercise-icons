/**
 * NOTE: RUNS IN THE CASPER ENVIRONMENT
 *
 * - wait for the page to load
 * - find something interesting
 * - take a screenshot
 *
 * `this` is the casper object
 * id: the id of an assessment item within a Perseus exercise
 */

var getInterestingBox;
try {
    getInterestingBox = require('./client/get-interesting-box.js');
} catch (e) { // freaking cross platformity
    getInterestingBox = require('./lib/capture/client/get-interesting-box.js');
}

function casperPerseus(id, dest) {
    this.then(function() {
        this.waitForSelector('#workarea .perseus-renderer');
    });
    this.then(function() {
        this.echo('Capturing perseus ' + id);
        var box = (this.evaluate(getInterestingBox, 256, 256)
            || this.getElementBounds('#workarea .perseus-renderer'));
        if (box.width === 0 || box.height === 0) {
            // Die early since a zero bound causes capture() to
            // confusingly fail with: "Failed to save screenshot to
            // FILENAME; please check permissions".
            this.die("Failed to take screenshot for " + id
                + " : Capture area has zero height or width (height:"
                + box.height + " width:" + box.width + ")");
        }
        var filename = dest + '/' + id + '.png';
        try {
            this.capture(filename, box);
        } catch (e) {
            this.die("Failed to take screenshot for " + id + " : " + e.message);
        }
    });
}

module.exports = casperPerseus;
