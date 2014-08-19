#!/usr/bin/env node

var fs = require('fs');
var data = require('../build/types/projectTypes.json');

var columns = ['CC tag', 'Skill Name', 'Associated CC tags', 'Previews'];

var multi = {};
var tags = Object.keys(data);
tags.sort();

tags.forEach(function (tag) {
    data[tag].skills.forEach(function (skill) {
        if (!multi[skill.slug]) {
            multi[skill.slug] = [];
        }
        multi[skill.slug].push(tag);
    });
});

var out = fs.createWriteStream(__dirname + '/../build/cc-tags.csv', {encoding: 'utf8'});

function formatRow(items) {
    return '"' + items.join('", "') + '"\n';
}

out.write(formatRow(columns));

tags.forEach(function (tag) {
    // console.log(tag)
    data[tag].skills.forEach(function (skill) {
        // console.log(skill)
        var row = [tag, skill.name];
        var otherTags = multi[skill.slug];
        var index = otherTags.indexOf(tag);
        row.push(otherTags.slice(0, index)
                          .concat(otherTags.slice(index + 1))
                          .join(','));
        if (skill.isKhanExercise) {
            row.push('http://sandcastle.kasandbox.org/media/castles/Khan:master/exercises/' + skill.fileName);
        } else {
            row = row.concat(skill.specimen.map(function (id) {
                return "https://www.khanacademy.org/preview/content/items/" + id;
            }));
        }
        out.write(formatRow(row));
    });
});

out.end();

