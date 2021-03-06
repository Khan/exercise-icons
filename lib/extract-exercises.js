/**
 * Take the data dump from the KA api and return a list of things to shoot.
 *
 * type is one of null, khan, or perseus. If null, return everything.
 * Otherwise, return everything of that type.
 */

function extractExercises(exercises, type) {
    var toShoot = [];
    exercises.forEach(function (ex) {
        if (ex.unlisted) {
            return;
        }

        if (!ex.problem_types.length) {
            if (type === 'perseus') {
                return;
            }
            toShoot.push({
                type: 'khan',
                name: ex.name,
                file_name: ex.file_name
            });
            return;
        }
        if (type === 'khan') {
            return;
        }

        var problemTypes = ex.problem_types.map(function (ptype) {
            // find the first live problem type
            for (var i=0; i<ptype.items.length; i++) {
                if (ptype.items[i].live) {
                    return ptype.items[i].id;
                }
            }
            console.log("Failed to find live item for problem type " + ptype.name, ex.name);
            return null;
        }).filter(identity);
        if (!problemTypes.length) {
            return;
        }
        toShoot.push({
            type: 'perseus',
            name: ex.name,
            problem_types: problemTypes
        });
    });
    return toShoot;
}

function identity(x) {
    return x;
}

module.exports = extractExercises;
