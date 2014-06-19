
var getExercises = require('./get-exercises');
var shootExercises = require('./shoot-exercises');
var extractExercises = require('./extract-exercises');

function findAndShootExercises(type, dest, done) {
    getExercises(function (err, exercises) {
        if (err) {
            return done(err);
        }
        var toShoot = extractExercises(exercises, type);
        shootExercises(toShoot, dest, function (err) {
            done(err, exercises);
        });
    });
}

module.exports = findAndShootExercises;
