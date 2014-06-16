
var capture = require('./capture');
var async = require('async');

function shootExercises(items, done) {
    var tasks = [];
    items.map(function (item) {
        if (item.type === 'khan') {
            tasks.push(capture.khan.bind(null, item.name));
        } else {
            tasks.push(capture.perseus.bind(null, item.id));
        }
    });
    async.parallel(tasks, function (err) {
        done(err);
    });
}

module.exports = shootExercises;
