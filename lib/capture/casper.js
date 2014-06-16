/**
 * Saves screenshots to ../../build/
 * If mode is perseus, only one shot is made, named [name].png
 * If mode is khan, one shot is made for *each* projectType, named
 * `[name-n].png` Where n is 0-indexed.
 *
 */

module.exports = function (/* seed, name, __dirname */) {
    var box;
    var currIdx = -1;

    main.call(this);

    function goPerseus() {
        this.echo('Capturing perseus ' + name);
        var filename = __dirname + 'build/' + name + '.png';
        if (box) {
            this.capture(filename, box);
        } else {
            this.captureSelector(filename, "#workarea");
        }
    }
    // Only functions here. They need to be embedded so that they will run in
    // the right context.
    function main() {
        this.then(function() {
            this.viewport(1280, 1024);
            this.wait(4000);
        });
        this.then(function() {
            var getInterestingBox = require(__dirname + '/client/get-interesting-box.js');
            box = this.evaluate(getInterestingBox, 256, 256, mode);
        });
        this.then(mode === 'perseus' ? goPerseus : goKhan);
    }

    function goKhan() {
        // Only screenshot if we've already found the first problem type
        if (currIdx !== -1) {
            this.echo('Capturing khan ' + name, currIdx);
            var filename = __dirname + '/../../build/' + name + '-' + currIdx + '.png';
            if (box) {
                this.capture(filename, box);
            } else {
                this.captureSelector(filename, "#problemarea");
            }
        }

        ++currIdx;
        var getNextKhanUrl = require(__dirname + '/client/get-next-khan-url.js');
        var nextUrl = this.evaluate(getNextKhanUrl, currIdx, ++seed);

        if (!nextUrl) {
            console.log('No more Khan Exercises');
            return;
        }

        this.open(nextUrl);
        this.then(function() {
            main.call(this, this);
        });
    }
};

