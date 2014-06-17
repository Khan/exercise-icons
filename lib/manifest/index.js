
var async = require('async');
var fs = require('fs');
var path = require('path');

var getTags = require('./get-tags');
var processTags = require('./process-tags');
var processExercises = require('./process-exercises');

/**
 * Make and write out the manifest. It is written to build/projectTypes.json
 *
 * exercises: the output of http://www.khanacademy.org/api/v1/exercises
 * done: fn(err) called when finished
 */
function makeManifest(exercises, done) {
    var dir = path.join(__dirname,  '../../build/types');
    async.parallel({
        files: fs.readdir.bind(null, dir),
        tags: getTags
    }, function (err, data) {
        if (err) {
            return done(err);
        }
        var manifest = processExercises(exercises, processTags(data.tags), data.files);
        var dest = path.join(dir, 'projectTypes.json');
        fs.writeFile(dest, JSON.stringify(manifest), done);
    });
};

module.exports = makeManifest;
