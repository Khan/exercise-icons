/**
 * Set things up and jump into the world of casper. This spawns a child
 * process for screenshotting.
 *
 * Once casper-khan has finished shooting, done() is called.
 * If there's an error, it is passed to done()
 *
 * @param string name the name of the exercise
 * @param string dest the directory to store the screenshot
 * @param {fn(err)} done called on completion
 */

var spookWrap = require('./spook-wrap');
var postProcess = require('./post-process');
var path = require('path');

function shootKhan(name, dest, done) {
    // Introduce some pseudo-randomness because 1-digit division
    // and basic division have the same screenshot for seed=43.
    var seed = 42;
    for (var i = 0; i < name.length; ++i) {
        seed += name.charCodeAt(i);
        seed %= 200;
    }
    var rawdest = path.join(dest, 'raw');
    var url = "http://sandcastle.kasandbox.org/media/castles/Khan:master/exercises/" +
        name + ".html?debug&seed=" + (++seed);

    spookWrap(url, 'casper-khan.js', [name, seed, rawdest], function (err) {
        if (err) {
            return done(err);
        }
        postProcess(name + '-0.png', dest, done);
    });
}

module.exports = shootKhan;
