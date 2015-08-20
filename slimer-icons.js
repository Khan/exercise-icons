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
    });
    var filename = dest + '/' + name + '.png';
    console.log('Capturing khan ' + name);

    var box = page.evaluate(getInterestingBox);
    page.clipRect = box;
    page.render(filename);
}

function shootPerseus(page, name, item, dest) {
    waitForSelector(page, "div.perseus-renderer");
    waitForImages(page);
    slimer.wait(500);

    var filename = dest + '/' + name + '.png';
    console.log('Capturing perseus ' + name);

    var box = page.evaluate(getInterestingBox);
    page.clipRect = box;
    page.render(filename);
}

var page = require("webpage").create();
var fs = require('fs');
var exercises = JSON.parse(fs.readFileSync('exercises.json'));

function shootExercises(currIndex) {
    if (currIndex >= exercises.length) {
        slimer.exit();
/*    } else if (exercises[currIndex].type === "khan-exercises") {
        shootExercises(currIndex + 1); */
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
                console.log(currIndex + " / " + exercises.length);
                if (exercise.type === "khan-exercises") {
                    shootKhan(page, exercise.name, 'slimerraw');
                } else {
                    shootPerseus(page, exercise.name, 'slimerraw');
                }
                shootExercises(currIndex + 1);
            });
    }
}
shootExercises(0);
