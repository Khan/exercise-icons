/**
 * Compile the data for the projectTypes.json
 *
 * @param {array} exercises from getExercises. Looks like [{
 *   "title": "Human Readable",
 *   "name": "machine_readable_1",
 *   "assessment_item_tags": [
 *      "tag id", ... // matches with the tags param
 *   ],
 *   "problem_types": [
 *     {
 *       "name": "human readable",
 *       "items": [
 *         {
 *           "live": bool,
 *           "id": "some id",
 *           "sha": "for fun"
 *         },
 *         ...
 *       ]
 *     },
 *     ...
 *   ]
 * }]
 *
 * @param {object} tags from processTags. Looks lke {
 *   "tag id": "Math.CC.some.thing",
 *   ...
 * }
 *
 * @param {array} files the filenames in the /build/ directory. Used for
 * discovering problem types of khan exercises.
 *
 * @return {object} looks like {
 *   "Math.CC.something": {
 *     "name": "Math.CC.something",
 *     "skills": [
 *       {
 *         "name": "The human readable title from exercises",
 *         "slug": "the_machine_readable_name_from_exercises",
 *         "isKhanExercise": bool,
 *         "specimen": [
 *           str, // either a list of numbers if this is a KhanExercise,
 *                // otherwise a list of problem type ids
 *         ],
 *         "questions": int,    // the number of questions. 200 if it's a
 *                              // KhanExercise
 *         "problemTypes": int, // length of the specimen list
 *                              // TODO(jared): redundant?
 *
 *         // artifacts of the old system
 *         "requiresTagging": bool,
 *         "tagURLs": [str, ]
 *       },
 *       ...
 *     ]
 *   },
 *   ...
 * }
 */

function processExercises(exercises, tags, files) {
    var cores = {};
    exercises.forEach(function(ex) {
        var specimen = [];
        var isKhan = !!ex.problem_types.length;
        if (isKhan) {
            specimen = files.filter(function (fname) {
                return fname.indexOf(ex.name + '-') === 0
            }).map(function (fname) {
                return +fname.slice(ex.name + '-').split('.')[0];
            });
        } else {
            specimen = ex.problem_types.map(function (ptype) {
                for (var i=0; i<pt.items.length; i++) {
                    if (pt.items[i].live) {
                        return pt.items[i].id
                    }
                }
                console.errror("Failed to find live item for problem type " + pt.name);
            });
        }

        ex.assessment_items.forEach(function (id) {
            if (!tags[id]) {
                return;
            }
            var coreName = tags[id];
            if (!cores[coreName]) {
                cores[coreName] = {name: coreName, skills: []};
            }
            cores[coreName].skills.push({
                name: ex.title,
                slug: ex.name,
                isKhanExercise: isKhan,
                problemTypes: specimen.length,
                questions: isKhan ? 200 : ex.items.length,
                specimen: specimen,

                // TODO(jared): these should no longer be needed...
                requiresTagging: false,
                tagURLs: []
            });
        });
    });

    return cores;
}

module.exports = processExercises;
