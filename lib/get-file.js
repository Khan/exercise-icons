
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
