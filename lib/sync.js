
var async = require('async')

/**
 * Grab the things, write to the file (if given), call done with a list of the
 * exercises.
 */
module.exports = function sync(done) {
    async.parallel({
        tags: getTags,
        exercises: get_exercises
    }, function (err, data) {
        var exercises = processExercises(data.exercises, data.tags);
    })
};

function processTags(data, prefix) {
    var tags = {};
    prefix = prefix || 'Math.CC.';
    data.forEach(function (tag) {
        if (tag.display_name.indexOf(prefix) !== 0) {
            return;
        }
        tags[tag.id] = tag.display_name;
    });
    return tags;
}

function getTags(next) {
    request.get('http://www.khanacademy.org/api/v1/assessment_items/tags')
        .end(function (err, res) {
            next(err, res.body);
        });
}

function getExercises(next) {
    request.get('http://www.khanacademy.org/api/v1/exercises')
        .end(function (err, res) {
            next(err, res.body);
        });
}

