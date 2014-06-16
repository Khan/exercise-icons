/**
 * // just make these icons
 * exerciseIcons([exercise, ...], done)
 * // make all the icons
 * exerciseIcons(null, done)
 *
 * where exercise looks like: 
 *   {
 *     type: 'perseus',
 *     name: 'addition_1',
 *     ids: ['x...', ...]
 *   } OR {
 *     type: 'khan',
 *     name: 'addition_1'
 *   }
 */

var async = require('async');

var shootAllExercises = require('./shoot-all-exercises');
var shootExercises = require('./shoot-exercises');

var makeManifest = require('./manifest');
var getExercises = require('./get-exercises');

function exerciseIcons(exercises, done) {
    if (arguments.length === 1) {
        done = exercises;
        exercises = null;
    }
    if (exercises) {
        async.parallel({
            exercises: getExercises,
            _: shootExercises.bind(null, exercises)
        }, function (err, data) {
            makeManifest(data.exercises, done);
        }):
    } else {
        shootAllExercises(function (err, exercises) {
            makeManifest(exercises, done);
        });
    }
}

module.exports = exerciseIcons;
