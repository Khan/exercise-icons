var getInterestingBox = require('./lib/capture/client/get-interesting-box.js');
var addProximaNova = require('./lib/capture/client/add-proxima-nova.js');

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

function shootKhan(page, name, dest) {
    page.evaluate(addProximaNova);
    waitForSelector(page, "#workarea");
    waitForImages(page);
    slimer.wait(1000);
    page.evaluate(function() {
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
                    shootKhan(page, exercise.name, 'slimerraw');
                } else {
                    shootPerseus(page, exercise.name, 'slimerraw');
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
