/**
 * This processes the images in /build/raw/ in the event that you want to skip
 * screenshotting and just process (generally useful while tweaking the
 * processing parameters).
 *
 * @param array allExercises from get-exercises.js
 * @param string dest the /build directory
 * @param fn done(err)
 */

var fs = require('fs');
var path = require('path');
var async = require('async');
var progress = require('progress');
var debug = require('debug')('exicons:process-shots');

var postProcess = require('./capture/post-process');
var processMain = require('./capture/process-main');
var extractExercises = require('./extract-exercises');

function processShots(allExercises, dest, done) {
    var dir = path.join(dest, 'types');
    var exercises = extractExercises(allExercises);

    fs.readdir(dir, function (err, files) {
        if (err) {
            return done(err);
        }
        var bar = new progress('processing [:bar] :percent :etas', {total: exercises.length, width: 100});
        var tasks = [];
        exercises.forEach(function (ex) {
            tasks.push(function (next) {
                processOne(ex, dest, files, function (err) {
                    bar.tick();
                    next(err);
                });
            });
        });
        async.parallelLimit(tasks, 4, function (err) {
            console.log('Finisheddd!');
            done(err);
        });
    });
}

function processOne(ex, dest, files, done) {
    if (ex.type === 'perseus') {
        processPerseus(ex, dest, done);
    } else {
        processKhan(ex, dest, files, done);
    }
}

function processKhan(ex, dest, files, done) {
    var tasks = [];
    var name = ex.name;
    debug('start khan', name);
    tasks.push(function (next) {
        var fname = name + '-0.png';
        if (!fs.existsSync(path.join(dest, 'raw', fname))) {
            console.log('Screenshot not found!', fname);
            return next();
        }
        postProcess(fname, dest, function (err) {
            if (err) {
                return next(err);
            }
            processMain(name, fname, dest, next);
        });
    });
    var i = 1;
    while (files.indexOf(name + '-' + i + '.png') !== -1) {
        var fname = name + '-' + i + '.png';
        tasks.push(postProcess.bind(null, fname, dest));
        i += 1;
    }
    async.parallel(tasks, function (err) {
        debug('done khan', name);
        done(err);
    });
}

function processPerseus(ex, dest, done) {
    var tasks = [];
    var name = ex.name;
    var ids = ex.problem_types;
    debug('start perseus', name);
    tasks.push(function (next) {
        var fname = ids[0] + '.png';
        if (!fs.existsSync(path.join(dest, 'raw', fname))) {
            console.log('Screenshot not found!', fname);
            return next();
        }
        postProcess(fname, dest, function (err) {
            if (err) {
                return next(err);
            }
            processMain(name, fname, dest, next);
        });
    });
    ids.slice(1).forEach(function (id) {
        if (!fs.existsSync(path.join(dest, 'raw', id + '.png'))) {
            console.log('Screenshot not found!', id + '.png');
            return;
        }
        tasks.push(postProcess.bind(null, id + '.png', dest));
    });
    async.parallel(tasks, function (err) {
        debug('perseus done', name);
        done(err);
    });
}

module.exports = processShots;
