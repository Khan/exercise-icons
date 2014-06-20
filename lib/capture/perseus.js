/**
 * Shoot and process a perseus skill
 *
 * @param string name the skill name
 * @param array ids the ids of the problem types
 * @param string dest the /build path
 * @param fn done
 */

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
            processMain(name, ids[0] + '.png', dest, function (err) {
                if (err) {
                    err.message = 'Perseus id' + ids[0] + ': ' + err.message;
                }
                next(err);
            });
        });
    });
    tasks = tasks.concat(ids.slice(1).map(function (id) {
        return function (next) {
            shootPerseus(id, dest, function (err) {
                if (err) {
                    err.message = 'Perseus id' + id + ': ' + err.message;
                }
                next(err);
            });
        };
    }));
    async.parallel(tasks, done);
}

module.exports = perseus;
