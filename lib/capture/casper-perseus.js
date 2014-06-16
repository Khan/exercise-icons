/**
 * NOTE: RUNS IN THE CASPER ENVIRONMENT
 *
 * `this` is the casper object
 * id: the id of a problem_type
 */

var getInterestingBox = require('./client/get-interesting-box.js');

function casperPerseus(id, dest) {
    this.then(function() {
        this.viewport(1280, 1024);
        this.wait(4000);
    });
    this.then(function () {
        var box = this.evaluate(getInterestingBox, 256, 256, mode);
        this.echo('Capturing perseus ' + name);
        var filename = dest + '/' + name + '.png';
        if (box) {
            this.capture(filename, box);
        } else {
            this.captureSelector(filename, "#workarea");
        }
    });
}

module.exports = casperPerseus;
