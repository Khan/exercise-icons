
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
};

function filter(exercises, dest, done) {
    async.filter(exercises, filterOne.bind(null, dest), done);
}

function filterOne(dest, item, done) {
    if (item.type === 'khan') return existsKhan(dest, item, done);
    existsPerseus(dest, item, done);
}

function existsKhan(dest, item, done) {
    var fname = path.join(dest, 'small', item.name + '.png');
    fs.exists(fname, function (exists) {
        done(!exists);
    });
}

function existsPerseus(dest, item, done) {
    var tasks = item.problem_types.filter(function (id) {return id;}).map(function (id) {
        return function (next) {
            fs.exists(path.join(dest, 'raw', id + '.png'), function (exists) {
                next(!exists);
            });
        };
    });
    async.parallel(tasks, function (err) {
        done(!!err);
    });
}

