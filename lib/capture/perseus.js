/**
 * Generate tasks for shooting perseus screenshots.
 *
 * @param string name the skill name
 * @param array ids the ids of the problem types
 * @param string dest the /build path
 * @param fn done
 */

var shootPerseus = require('./shoot-perseus');
var processMain = require('./process-main');
var debug = require('debug')('exicons:perseus');

function perseus(name, ids, dest) {
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
        if (!id) return false;
        return function (next) {
            shootPerseus(id, dest, function (err) {
                if (err) {
                    err.message = 'Perseus id' + id + ': ' + err.message;
                }
                next(err);
            });
        };
    }).filter(function (x) {return x;}));

    return tasks;
}

module.exports = perseus;
