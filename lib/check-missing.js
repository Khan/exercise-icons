/**
 * Check for missing images in common core.
 *
 * Outputs a list of images that are referenced in /types/problemTypes.json
 * but aren't found in /types/
 */

var fs = require('fs');
var path = require('path');

function checkMissing(dest, done) {
    fs.readdir(path.join(dest, 'types'), function (err, names) {
        var types = require(path.join(dest, 'types', 'problemTypes.json'));
        var missing = []
        for (var name in types) {
            types[name].skills.forEach(function (skill) {
                skill.specimen.forEach(function (id) {
                    var fullname = skill.isKhanExercise ? (skill.slug + '-' + id) : id
                    if (names.indexOf(fullname + '.png') === -1) {
                        missing.push([skill, id, fullname])
                    }
                })
            })
        }
        console.log(missing.map(function (item) {
            return item[0].name + '; ' + item[1] + '; ' + item[2]
        }).join('\n'))
        console.log(missing.length + ' missing images')
        fs.writeFile('cc-missing.json', JSON.stringify(missing, null, 4), done)
    })
}

module.exports = checkMissing;

