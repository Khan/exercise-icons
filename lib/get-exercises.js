/**
 * Get the exercise data from the KA api
 */

var request = require('superagent');

function getExercises(next) {
    request.get('http://www.khanacademy.org/api/v1/exercises')
        .end(function (err, res) {
            next(err, res.body);
        });
}

module.exports = getExercises;

/* *
module.exports = function (next) {
    next(null, require('../data/exercises.json'));
}
/* */
