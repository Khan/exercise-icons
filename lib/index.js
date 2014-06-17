/**
 * // just make these icons
 * exerciseIcons(exercises, [options], done)
 * // make all the icons
 * exerciseIcons(done)
 *
 * where exercises looks like: [
 *   {
 *     type: 'perseus',
 *     name: 'addition_1',
 *     ids: ['x...', ...]
 *   } OR {
 *     type: 'khan',
 *     name: 'addition_1'
 *   },
 *   ...
 * ]
 *
 * options:
 *  noManifest: [false] don't write the projectTypes.json manifest
 */

var async = require('async');
var path = require('path');

var shootAllExercises = require('./shoot-all-exercises');
var shootExercises = require('./shoot-exercises');

var makeManifest = require('./manifest');
var getExercises = require('./get-exercises');
var syncToS3 = require('./sync-to-s3.js');

var DEST = path.join(__dirname, '../build');

function exerciseIcons(exercises, options, done) {
    if (arguments.length === 1) {
        done = exercises;
        exercises = null;
    }
    if (arguments.length === 2) {
        done = options;
        options = null;
    }
    var finish = function () {
        if (!options.upload) {
            return done();
        }
        syncToS3(options.s3.key, options.s3.secret, options.s3.bucket, done);
    };
    if (options.justManifest) {
        return getExercises(function (err, data) {
            makeManifest(data, finish);
        });
    }
    if (exercises) {
        async.parallel({
            exercises: getExercises,
            _: shootExercises.bind(null, exercises, DEST)
        }, function (err, data) {
            if (err) {
                return done(err);
            }
            if (options.noManifest) {
                return finish();
            }
            makeManifest(data.exercises, finish);
        });
    } else {
        shootAllExercises(DEST, function (err, exercises) {
            if (err) {
                return done(err);
            }
            if (options.noManifest) {
                return finish();
            }
            makeManifest(exercises, finish);
        });
    }
}

module.exports = exerciseIcons;
