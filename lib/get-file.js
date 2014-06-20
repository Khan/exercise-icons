
/**
 * Get the list of exercises to shoot from a file or from standard in, as
 * denoted by the string "-"
 *
 * done(err, selected) is called with the parsed JSON data
 */

var getStdin = require('./get-stdin');
var path = require('path');

function getFile(file, done) {
    if (file === '-') {
        return getStdin(done);
    }
    var selected;
    try {
        selected = require(path.resolve(file));
    } catch (e) {
        console.error(e);
        return done(new Error('Unable to read file ' + file + '. Aborting.'));
    }
    done(null, selected);
}

module.exports = getFile;
