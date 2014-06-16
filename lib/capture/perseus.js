
var async = require('async');
var shootPerseus = require('./shoot-perseus');
var processMain = require('./process-main');

function perseus(name, ids, done) {
    var tasks = [];
    tasks.push(function (next) {
        shootPerseus(id, function (err) {
            if (err) {
                return next(err);
            }
            processMain(name, id + '.png', next);
        });
    });
    tasks = tasks.concat(ids.slice(1).map(function (id) {
        return shootPerseus.bind(null, id);
    }));
    async(tasks, done);
}

module.exports = perseus;
