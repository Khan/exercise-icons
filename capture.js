#!/usr/bin/env casperjs
/* Given an assessment item or khan exercise slug, generate some screenshots
 * which should be post-processed elsewhere into square icons using imagemagick.
 *
 * This script has two modes:
 *  1. perseus: Takes a snapshot of __ONE__ AssessmentItem
 *         Activated when <item> starts with x. Thankfully, no khan-exercise start with 'x'.
 *         Stores a snapshot as build/<item>.png
 *
 *  2. ke: Takes a snapshot of one generated exercise of __EACH__ type
 *         Activiated when <item> does not start with x. Thankfully, no khan-exercise starts with 'x'.
 *         Stores snapshots as build/<item | string>-<problemType | int>.png
 *
 *  This is used by sync.d.
 *
 * Usage:
 * $ ./captureitem.js <item>
 */

var casper = require("casper").create();
var addProximaNova = require('./add-proxima-nova.js');

casper.on('remote.message', function(message) {
    console.log(message);
});

if (casper.cli.args.length < 1) {
    casper
        .echo("Common tasks:")
        .echo("  - Generate a screenshot of a perseus AssessmentItem:")
        .echo("         $ ./capture.js x31efcb75db37b2e9")
        .echo("         ; generates ./build/x31efcb75db37b2e9.png")
        .echo("")
        .echo("  - Generate a screenshot for each type of a khan-exercise:")
        .echo("         $ ./capture.js comparing_whole_numbers")
        .echo("         ; generates ./build/comparing_whole_numbers-*.png")
        .echo("")
        .echo("  - Get more help:")
        .echo("         $ cat ./capture.js")
        .exit(1);
}

var itemId;
var mode;
var seed;

itemId = casper.cli.args[0];
if (!itemId.length) {
    casper
        .echo("Item id is empty")
        .exit(1);
}

// Introduce some pseudo-randomness because 1-digit division
// and basic division have the same screenshot for seed=43.
seed = 42;
for (var i = 0; i < itemId.length; ++i) {
    seed += itemId.charCodeAt(i);
    seed %= 200;
};

// No khan-exercise starts with 'x'. If that changes, this will also have
// to change.
if (itemId[0] === 'x') {
    mode = "perseus";
    screenshotUrl = "https://www.khanacademy.org/preview/content/items/" + itemId;
} else {
    mode = "ke";
    screenshotUrl = "http://sandcastle.kasandbox.org/media/castles/Khan:master/exercises/" +
        itemId + ".html?debug&seed=" + (++seed);
}

casper.start(screenshotUrl, function() {
    this.echo('Current location is ' + this.getCurrentUrl(), 'info');
    if (mode === "ke") {
        // Fix for Proxima Nova not being loaded on sandcastle.
        this.evaluate(addProximaNova);
    }
});

var bb;
var currIdx = -1;

var boundingBox = require('./bounding-box.js');

function takeSnapshot(casper) {
    this.then(function() {
        this.viewport(1280, 1024);
        this.wait(4000);
    });
    this.then(function() {
        bb = this.evaluate(function(width, height, mode) {

            // We need '?debug=1' to see the problem types, but we don't
            // want the debug borders.
            $("body").removeClass("debug");

            var $pretties = $("#workarea img")
                .add("#workarea table")
                .add("#workarea .graphie")
                .add("#workarea .perseus-widget-plotter")
                .add("#workarea .perseus-widget-interactive-graph")
                .add("#workarea .perseus-widget-expression")
                .add("#workarea .perseus-widget-measurer")
                .add("#workarea .draggy-boxy-thing")
                .add("#workarea .perseus-widget-interactive-number-line");
            var bb = boundingBox($pretties);

            if (bb.width < 60 || bb.height < 40) {
                document.getElementById("workarea").style.width =
                    width + "px";
                return 0;
            }

            return bb;
        }, 256, 256, mode);
    });
    this.then(function() {
        if (mode === "perseus" || currIdx !== -1) {
            this.echo('Capturing ' + itemId);
            var idx = mode === "perseus" ? "" : ("-" + currIdx);
            var filename = 'build/' + itemId + idx + '.png';
            if (bb) {
                this.capture(filename, bb);
            } else {
                this.captureSelector(filename, (mode === "perseus" ?
                    "#workarea" : "#problemarea"));
            }
        }

        if (mode === "ke") {
            ++currIdx;
            var nextUrl = this.evaluate(function(currIdx, seed) {
                if ($("#debug p div").children("a").length > currIdx) {
                    return $("#debug p div").children("a")[currIdx].href +
                        "&seed=" + seed;
                }
                return null;
            }, currIdx, ++seed);

            if (nextUrl) {
                this.open(nextUrl);
                this.then(function() {
                    takeSnapshot.call(this, this);
                });
            }
        }
    });
};

casper.then(takeSnapshot);

casper.run();
