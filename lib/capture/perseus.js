
var async = require('async');
var shootPerseus = require('./shoot-perseus');
var processMain = require('./process-main');
var debug = require('debug')('exicons:perseus');

function perseus(name, ids, dest, done) {
    var tasks = [];
    debug('shooting perseus', name, ids);
    tasks.push(function (next) {
        shootPerseus(ids[0], dest, function (err) {
            if (err) {
                return next(err);
            }
            processMain(name, ids[0] + '.png', dest, next);
        });
    });
    tasks = tasks.concat(ids.slice(1).map(function (id) {
        return shootPerseus.bind(null, id, dest);
    }));
    async.parallel(tasks, done);
}

module.exports = perseus;
