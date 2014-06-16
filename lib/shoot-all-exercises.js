
var getExercises = require('./get-exercises');
var shootExercises = require('./shoot-exercises');
var extractExercises = require('./extract-exercises');

function shootAllExercises(done) {
    getExercises(function (err, exercises) {
        if (err) {
            return done(err);
        }
        var toShoot = extractExercises(exercises);
        shootExercises(toShoot, function (err) {
            done(err, exercises);
        });
    });
}

module.exports = shootAllExercises;
