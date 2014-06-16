/**
 * Take the data dump from the KA api and return a list of things to shoot.
 */

function extractExercises(exercises) {
    var toShoot = [];
    exercises.forEach(function (ex) {
        if (!ex.problem_types.length) {
            toShoot.push({
                type: 'khan',
                name: ex.name
            });
            return;
        }
        toShoot = toShoot.push({
            type: 'perseus',
            name: ex.name,
            problem_types: ex.problem_types.map(function (ptype) {
                // find the first live problem type
                for (var i=0; i<pt.items.length; i++) {
                    if (pt.items[i].live) {
                        return {
                            type: 'perseus',
                            id: pt.items[i].id
                        };
                    }
                }
                console.errror("Failed to find live item for problem type " + pt.name);
                return null;
            }).filter(identity)
        });
    });
    return toShoot;
}

function identity(x) {
    return x;
}

module.exports = extractExercises;
