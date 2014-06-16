/* Given an assessment item or khan exercise slug, generate some screenshots
 * which should be post-processed elsewhere into square icons using imagemagick.
 *
 * This script has two modes:
 *  1. perseus: Takes a snapshot of __ONE__ AssessmentItem
 *         Stores a snapshot as build/<item>.png
 *
 *  2. ke: Takes a snapshot of one generated exercise of __EACH__ type
 *         Stores snapshots as build/<item | string>-<problemType | int>.png
 *
 */

var shoot = require('./shoot');

module.exports = {
    khan: function (name, done) {
        // Introduce some pseudo-randomness because 1-digit division
        // and basic division have the same screenshot for seed=43.
        var seed = 42;
        for (var i = 0; i < name.length; ++i) {
            seed += name.charCodeAt(i);
            seed %= 200;
        };
        var mode = "ke";
        var screenshotUrl = "http://sandcastle.kasandbox.org/media/castles/Khan:master/exercises/" +
            name + ".html?debug&seed=" + (++seed);
        shoot(screenshotUrl, 'khan', name, seed, done);
    },

    perseus: function (id, done) {
        var mode = "perseus";
        var screenshotUrl = "https://www.khanacademy.org/preview/content/items/" + id;
        shoot(screenshotUrl, 'perseus', id, null, done);
    }
}

