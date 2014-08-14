
/**
 * Check to see if an item has been screenshotted already
 */

var fs = require('fs');
var async = require('async');
var path = require('path');

module.exports = {
    filter: filter,
    khan: existsKhan,
    perseus: existsPerseus
}

function filter(exercises, dest, done) {
    async.filter(exercises, filterOne.bind(null, dest), done)
}

function filterOne(dest, item, done) {
    var fname = path.join(dest, 'small', item.name + '.png')
    // console.log('check', fname, item)
    fs.exists(fname, function (exists) {
        done(!exists);
    });
}

function existsKhan(item, done) {
}

function existsPerseus(item) {
}

