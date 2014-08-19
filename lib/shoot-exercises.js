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

function shootExercises(items, dest, parallel, done) {
    _shootExercises(items, dest, parallel, false, done);
}

function _shootExercises(items, dest, parallel, retrying, done) {
    var tasks = [];
    var log = fs.createWriteStream('./capture-errors.log');
    var failures = [];
    var missing = [];

    items.forEach(function (item) {
        if (item.type === 'khan') {
            if (!item.file_name) {
                return missing.push(item)
            }

            tasks.push(function (next) {
                khan(item.name, item.file_name, dest, function (err) {
                    bar.tick();
                    if (err) {
                        log.write('failed khan ' + item.name + ' ' + item.file_name + ' : ' + err.message + '\n');
                        item.message = err.message;
                        debug('failed khan', item.name, err.message);
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
            tasks = tasks.concat(perseus(item.name, item.problem_types, dest).map(function (task) {
                return function (next) {
                    task(function (err) {
                        bar.tick();
                        if (err) {
                            log.write('failed perseus ' + item.name + ' : ' + item.problem_types + ' : ' + err.message + '\n');
                            debug('failed perseus', item.name, err.message);
                            item.message = err.message;
                            if (err instanceof errors.NotFound) {
                                if (missing.indexOf(item) === -1) {
                                    missing.push(item);
                                }
                            } else {
                                if (failures.indexOf(item) === -1) {
                                    failures.push(item);
                                }
                            }
                        }
                        next()
                    })
                }
            }));
        }
    });

    var bar = new progress('Screenshotting [:bar] :percent :eta :current/:total', {
        total: tasks.length,
        width: 200,
    });

    debug('Shooting', tasks.length, 'items');
    async.parallelLimit(tasks, parallel, function (err) {
        debug('Done shooting', err);
        if (retrying) {
            fs.writeFileSync('failed-shots.json', JSON.stringify(failures, null, 4));
            fs.writeFileSync('missing-shots.json', JSON.stringify(retrying.concat(missing), null, 4));
            done(err)
        } else {
            console.log('Trying again for the ones that failed', failures.length);
            _shootExercises(failures, dest, parallel, missing, done);
        }
    });
}

module.exports = shootExercises;
