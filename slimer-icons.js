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

function waitForSelector(page, selector) {
    while (true) {
        var exists = page.evaluate(function(selector) {
            return !!document.querySelector(selector);
        }, selector);

        if (exists) {
            break;
        } else {
            slimer.wait(100);
        }
    }
}

function waitForImages(page) {
    while (true) {
        var loaded = page.evaluate(function() {
            var good = true;
            $("img").each(function(i, img) {
                if (!img.complete) {
                    good = false;
                }
            });
            return good;
        });

        if (loaded) {
            break;
        } else {
            slimer.wait(100);
        }
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


function shootKhan(page, name, dest) {
    page.evaluate(addProximaNova);
    waitForSelector(page, "#workarea");
    waitForImages(page);
    slimer.wait(1000);
    page.evaluate(function() {
        $("body").removeClass("debug");
        $("div.qtip").hide();
        $("input").blur();
    });
    var filename = dest + '/' + name + '.png';

    var box = page.evaluate(getInterestingBox);
    page.clipRect = box;
    page.render(filename);
}

function shootPerseus(page, name, dest) {
    waitForSelector(page, "div.perseus-renderer");
    waitForImages(page);
    slimer.wait(500);

    page.evaluate(function() {
        $("div.qtip").hide();
        $("input").blur();
    });
    var filename = dest + '/' + name + '.png';

    var box = page.evaluate(getInterestingBox);
    page.clipRect = box;
    page.render(filename);
}

var webpage = require('webpage');
var fs = require('fs');
var exercises = JSON.parse(fs.readFileSync('exercises.json'));

// Run more than one page at a time, for parallelism or something.
var numPages = 2;

var finishedPages = 0;
function finish() {
    finishedPages++;
    if (finishedPages === numPages) {
        slimer.exit();
    }
}

var finishedShots = 0;
function doLog(type, name) {
    finishedShots++;
    console.log(finishedShots + " / " + exercises.length + " - " + type + ": " + name);
}

function shootExercises(page, currIndex) {
    if (currIndex >= exercises.length) {
        finish();
/*    } else if (exercises[currIndex].type === "khan-exercises") {
        shootExercises(page, currIndex + numPages); */
    } else {
        var exercise = exercises[currIndex];
        var url;
        if (exercise.type === "khan-exercises") {
            url = "http://exercises.ka.local/exercises/" + exercise.file_name + "?debug";
        } else {
            url = "https://www.khanacademy.org/preview/content/items/" + exercise.example_item;
        }

        page.open(url)
            .then(function() {
                if (exercise.type === "khan-exercises") {
                    shootKhan(page, exercise.name, OUTDIR);
                } else {
                    shootPerseus(page, exercise.name, OUTDIR);
                }
                doLog(exercise.type, exercise.name);
                shootExercises(page, currIndex + numPages);
            });
    }
}

for (var i = 0; i < numPages; i++) {
    var page = webpage.create();
    shootExercises(page, i);
}
