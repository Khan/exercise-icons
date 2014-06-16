/**
 * Get the exercise data from the KA api
 */

function getExercises(next) {
    request.get('http://www.khanacademy.org/api/v1/exercises')
        .end(function (err, res) {
            next(err, res.body);
        });
}

module.exports = getExercises;
