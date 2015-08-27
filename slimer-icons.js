/*
 * To use:
 *
 * Download an updated exercises.json, by running in BigQuery:
 *
 *  SELECT (CASE WHEN file_name = '' or file_name is null THEN 'perseus' ELSE 'khan-exercises' END) as type,
 *  name, file_name, NTH(1, problem_types.items.id) as example_item
 *  FROM [latest_content.Exercise]
 *  GROUP BY type, name, file_name
 *
 * Download the result as a CSV, and convert to JSON by running in python (for
 * some reason the 'download as JSON' doesn't produce valid JSON)
 *
 *  import csv
 *  import json
 *  json.dump([x for x in csv.DictReader(open("/path/to/results.csv"))], open('exercises.json', 'w'))
 *
 * Now, take all the screenshots by running this script:
 *
 *  mkdir slimer-raw
 *  slimerjs slimer-icons.js
 *
 * Finally, crop the images with imagemagick via:
 *
 *  mkdir slimer-thumbs
 *  cd slimer-raw
 *  for file in *; do echo ${file%.png}; convert -trim -- $file ../slimer-thumbs/${file%png}.jpg; done
 *
 * Yay!
 */

var OUTDIR = "slimer-raw";

function waitForSelector(page, selector, done) {
    var exists = page.evaluate(function(selector) {
        return !!document.querySelector(selector);
    }, selector);

    if (exists) {
        done();
    } else {
        setTimeout(function() {
            waitForSelector(page, selector, done);
        }, 100);
    }
}

function waitForImages(page, done) {
    var loaded = page.evaluate(function() {
        if (!$ || !_) {
            return false;
        }

        var good = true;
        $("img").each(function(i, img) {
            if (!img.complete) {
                good = false;
            }
        });
        return good;
    });

    if (loaded) {
        done();
    } else {
        setTimeout(function() {
            waitForImages(page, done);
        }, 100);
    }
}

function addProximaNova() {
    var newStyle = document.createElement('style');
    newStyle.appendChild(document.createTextNode(
        "@font-face {" +
        "    font-family: 'Proxima Nova';" +
        "    src: url('https://www.kastatic.org/fonts/Proxima-Nova-Regular.woff') format('woff');" +
        "    font-weight: normal;" +
        "    font-style: normal;" +
        "}" +
        "" +
        "@font-face {" +
        "    font-family: 'Proxima Nova';" +
        "    src: url('https://www.kastatic.org/fonts/Proxima-Nova-Semibold.woff') format('woff');" +
        "    font-weight: bold;" +
        "    font-style: normal;" +
        "}" +
        "" +
        "@font-face {" +
        "    font-family: 'Proxima Nova Bold';" +
        "    src: url('https://www.kastatic.org/fonts/Proxima-Nova-Semibold.woff') format('woff');" +
        "    font-weight: normal;" +
        "    font-style: normal;" +
        "}" +
        "body {" +
        "   font-family: 'Proxima Nova';" +
        "}"));
    document.head.appendChild(newStyle);
}

function getInterestingBox() {

    // this must be embedded, because the outer function is being injected
    // into the browser's javascript runtime.
    var boundingBox = function(items) {
        var box = {
            minX: 1.0 / 0,
            minY: 1.0 / 0,
            maxX: 0,
            maxY: 0
        };

        _.each(items, function(item) {
            var bb = {
                x: $(item).offset().left,
                y: $(item).offset().top,
                width: $(item).width(),
                height: $(item).height()
            };

            box = {
                minX: Math.min(bb.x, box.minX),
                minY: Math.min(bb.y, box.minY),
                maxX: Math.max(bb.x + bb.width, box.maxX),
                maxY: Math.max(bb.y + bb.height, box.maxY)
            };
        });

        return {
            left: box.minX - 3,
            top: box.minY - 3,
            width: box.maxX - box.minX + 6,
            height: box.maxY - box.minY + 6
        };
    };

    var interesting_things = [];

    var $pretties = $("#workarea");
    interesting_things.forEach(function(name) {
        $pretties = $pretties.add('#workarea ' + name);
    });
    return boundingBox($pretties);
}


function shootKhan(page, name, dest, done) {
    page.evaluate(addProximaNova);
    waitForSelector(page, "#workarea", function() {
        waitForImages(page, function() {
            setTimeout(function() {
                page.evaluate(function() {
                    $("body").removeClass("debug");
                    $("div.qtip").hide();
                    $("input").blur();
                });
                var filename = dest + '/' + name + '.png';

                var box = page.evaluate(getInterestingBox);
                page.clipRect = box;
                page.render(filename);
                done();
            }, 1000);
        });
    });
}

function shootPerseus(page, name, dest, done) {
    waitForSelector(page, "div.perseus-renderer", function() {
        waitForImages(page, function() {
            setTimeout(function() {
                page.evaluate(function() {
                    $("div.qtip").hide();
                    $("input").blur();
                });
                var filename = dest + '/' + name + '.png';

                var box = page.evaluate(getInterestingBox);
                page.clipRect = box;
                page.render(filename);
                done();
            }, 500);
        });
    });
}

var webpage = require('webpage');
var fs = require('fs');
var exercises = JSON.parse(fs.readFileSync('exercises.json'));

// Run more than one page at a time, for parallelism or something.
var numPages = 1;

var finishedPages = 0;
function finish() {
    finishedPages++;
    if (finishedPages === numPages) {
        slimer.exit();
    }
}

var finishedShots = 0;
function doLog(index, type, name) {
    finishedShots++;
    console.log(finishedShots + " / " + exercises.length + " (" + (index + 1) + ")" +
                " - " + type + ": " + name);
}

var timeout;

function shootExercises(page, currIndex) {
    if (currIndex >= exercises.length) {
        finish();
/*    } else if (exercises[currIndex].name === "tien-scaling-5") {
        shootExercises(page, currIndex + numPages); */
    } else {
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            shootExercises(page, currIndex + numPages);
        }, 20000);

        var exercise = exercises[currIndex];
        var url;
        if (exercise.type === "khan-exercises") {
            url = "http://exercises.ka.local/exercises/" + exercise.file_name + "?debug";
        } else {
            url = "https://www.khanacademy.org/preview/content/items/" + exercise.example_item;
        }

        page.open(url)
            .then(function() {
                function done() {
                    doLog(currIndex, exercise.type, exercise.name);
                    clearTimeout(timeout);
                    shootExercises(page, currIndex + numPages);
                }

                if (exercise.type === "khan-exercises") {
                    shootKhan(page, exercise.name, OUTDIR, done);
                } else {
                    shootPerseus(page, exercise.name, OUTDIR, done);
                }
            });
    }
}

for (var i = 0; i < numPages; i++) {
    var page = webpage.create();
    /*
    page.onError = function(message) {
        console.log("Error: " + message);
    };
    page.onResourceError = function(message) {
        console.log("Resource error: " + JSON.stringify(message));
    };
    page.onConsoleMessage = function(message) {
        console.log("Console message: " + message);
    };
    */
    shootExercises(page, i);
}
