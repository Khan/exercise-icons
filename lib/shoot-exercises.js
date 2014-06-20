/**
 * Given a list of exercieses, generate screenshots to the given destination
 * folder.
 *
 * items looks like [{
 *   type: 'khan',
 *   name: 'some_name'
 * }, {
 *   type: 'perseus',
 *   name: 'some_name',
 *   project_types: ['id1', 'id2', ...]
 * },
 * ...]
 *
 * Done is called when all have finished.
 * Errors are written to ./capture-errors.log (relative to the user's current
 * directory).
 */

var async = require('async');
var debug = require('debug')('exicons:shoot-exercises');
var progress = require('progress');

var errors = require('./capture/errors');
var perseus = require('./capture/perseus');
var khan = require('./capture/khan');

var fs = require('fs');

function shootExercises(items, dest, done) {
    var tasks = [];
    var bar = new progress('Screenshotting [:bar] :percent :eta :current/:total', {
        total: items.length,
        width: 200,
    });
    var log = fs.createWriteStream('./capture-errors.log');
    var failures = [];
    var missing = [];
    items.map(function (item) {
        if (item.type === 'khan') {
            tasks.push(function (next) {
                khan(item.name, dest, function (err) {
                    bar.tick();
                    if (err) {
                        log.write('failed khan ' + item.name + ' : ' + err.message + '\n');
                        item.message = err.message;
                        if (err instanceof errors.NotFound) {
                            missing.push(item);
                        } else {
                            failures.push(item);
                        }
                    }
                    next();
                });
            });
        } else {
            tasks.push(function (next) {
                perseus(item.name, item.problem_types, dest, function (err) {
                    bar.tick();
                    if (err) {
                        log.write('failed perseus ' + item.name + ' : ' + item.problem_types + ' : ' + err.message + '\n');
                        item.message = err.message;
                        if (err instanceof errors.NotFound) {
                            missing.push(item);
                        } else {
                            failures.push(item);
                        }
                    }
                    next();
                });
            });
        }
    });
    debug('Shooting', items.length, 'items');
    async.parallelLimit(tasks, 10, function (err) {
        debug('Done shooting', err);
        fs.writeFileSync('failed-shots.json', JSON.stringify(failures, null, 4));
        fs.writeFileSync('missing-shots.json', JSON.stringify(missing, null, 4));
        done(err);
    });
}

module.exports = shootExercises;
