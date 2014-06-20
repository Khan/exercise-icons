/**
 * Used in the upload script.
 *
 * Run a series of tasks in parallel, with a limit of 10 concurrent tasks,
 * keeping track of return values and errors.
 */

var progress = require('progress');
var _ = require('lodash');

function runAll(tasks, done) {
    var waiting = tasks.length;

    var start = Date.now();
    var bar = new progress('uploading [:bar] :percent :etas', {total: tasks.length, width: 100});
    var failures = [];
    var results = [];

    var max = 10;
    var at = 0;
    var running = 0;

    advance();

    function advance() {
        var cat = at;
        at += max - running;
        if (at > tasks.length) {
            at = tasks.length;
        }
        var up = at - cat;
        for (var i=0; i<up; i++) {
            run(tasks[cat + i], cat + i);
        }
    }

    function run(task) {
        running += 1;
        task(_.once(function (err, data) {
            if (err) {
                console.error(err);
                failures.push(err);
            } else {
                results.push(data);
            }
            bar.tick();
            waiting -= 1;
            running -= 1;
            if (waiting <= 0) {
                // console.log('fin!', failures, results);
                console.log('Took', (Date.now() - start)/1000/60, 'minutes');
                return done(failures, results);
            }
            process.nextTick(function () {
                advance();
            });
        }));
    }
}

module.exports = runAll;
