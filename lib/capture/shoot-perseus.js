/**
 * Set things up and jump into the world of casper. This spawns a child
 * process for screenshotting.
 *
 * Once casper-perseus has finished shooting, done() is called.
 * If there's an error, it is passed to done()
 *
 * @param string id the id of the problem_type
 * @param string dest the directory to store the screenshot
 * @param {fn(err)} done called on completion
 */

var spookWrap = require('./spook-wrap');
var postProcess = require('./post-process');
var path = require('path');

function shootPerseus(id, dest, done) {
    var url = "https://www.khanacademy.org/preview/content/items/" + id;
    var rawdest = path.join(dest, 'raw');
    spookWrap(url, 'casper-perseus.js', [id, rawdest], function (err) {
        if (err) {
            return done(err);
        }
        postProcess(id + '.png', dest, done);
    });
}

module.exports = shootPerseus;
