/**
 * This is the main driver for the script.
 *
 * for options, see ../bin/usage.txt
 */

var path = require('path');

var shootExercises = require('./shoot-exercises');

var makeManifest = require('./manifest');
var selectExercises = require('./select-exercises');
var syncToS3 = require('./sync-to-s3.js');
var processShots = require('./process-shots');

function exerciseIcons(options, done) {
    options.dest = options.dest || path.join(__dirname, '../build');

    function finished(err) {
        if (err) {
            return done(err);
        }
        if (!options.upload) {
            return done();
        }
        syncToS3(options.s3.key, options.s3.secret, options.s3.bucket, done);
    }

    selectExercises(options, function (err, allExercises, selected) {
        if (err) {
            return finished(err);
        }
        if (options.manifest) {
            return makeManifest(allExercises, options.dest, finished);
        }
        if (options.image) {
            return processShots(selected, options.dest, options.parallel, function (err) {
                if (err) {
                    return finished(err);
                }
                makeManifest(allExercises, options.dest, finished);
            });
        }
        shootExercises(selected, options.dest, options.parallel, function () {
            makeManifest(allExercises, options.dest, finished);
        });
    });
}

module.exports = exerciseIcons;
