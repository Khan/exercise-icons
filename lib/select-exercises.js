/**
 * Select exercises to shoot based on the input options.
 *
 * For options, see /bin/usage.txt
 */

var async = require('async');

var exists = require('./exists');
var getFile = require('./get-file.js');
var getExercises = require('./get-exercises');
var extractExercises = require('./extract-exercises');

function selectExercises(options, done) {
    if (options.file) {
        return async.parallel({
            selected: getFile.bind(null, options.file),
            allExercises: getExercises
        }, function (err, data) {
            if (err) {
                return done(err);
            }
            done(null, data.allExercises, data.selected);
        });
    }
    var type = 'all';
    if (options.khan) {
        type = 'khan';
    } else if (options.perseus) {
        type = 'perseus';
    }
    getExercises(function (err, allExercises) {
        if (err) {
            return done(err);
        }
        var selected = extractExercises(allExercises, type);
        if (!options['new']) {
            return done(null, allExercises, selected);
        }
        console.log('filtering')
        exists.filter(selected, options.dest, function (remaining) {
            console.log('filtered', err, remaining.length);
            if (err) {
                return done(err);
            }
            console.log(selected.length, remaining.length);
            // return done(new Error('lol'));
            done(null, allExercises, remaining);
        });
    });
}

module.exports = selectExercises;
