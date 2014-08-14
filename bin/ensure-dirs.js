
var fs = require('fs');
var async = require('async');
var mkdirp = require('mkdirp');

module.exports = ensureDirs

function ensureDirs(dirs, done) {
    async.parallel(dirs.map(function (dir) {
        return mkdirp.bind(null, dir)
    }), done)
}


