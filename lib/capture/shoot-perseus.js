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

function shootPerseus(id, dest, done) {
    var url = "https://www.khanacademy.org/preview/content/items/" + id;

    spookWrap(url, 'casper-perseus.js', [id, dest], done);
}

module.exports = shootPerseus;
