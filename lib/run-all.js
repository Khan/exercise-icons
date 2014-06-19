
var progress = require('progress');

function runAll(tasks, done) {
    var waiting = tasks.length;
    var finished = new Array(tasks.length);

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

    function run(task, i) {
        // console.log('run', i, waiting, waiting/tasks.length, running, at);
        running += 1;
        task(function (err, data) {
            if (err) {
                console.error(err);
                failures[i] = err;
            } else {
                results[i] = data;
            }
            if (!finished[i]) {
                bar.tick();
                finished[i] = true;
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
            }
        });
    }
}

module.exports = runAll;
