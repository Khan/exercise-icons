/**
 * This instantiates the casperjs instance and then evaluates the casperShoot
 * function in the casper context, passing in its arguments.
 *
 * The `done` callback is called once the screenshotting is finished.
 */

var Spook = require("spooky");
var casperShoot = require('./casper');

module.exports = function (url, mode, name, seed, done) {
    var spook = new Spook({casper: {logLevel: 'error'}}, function (e) {
        spook.start(url, [{mode: mode, __dirname: __dirname}, function() {
            var addProximaNova = require(__dirname + '/client/add-proxima-nova.js');
            this.echo('Current location is ' + this.getCurrentUrl(), 'info');
            if (mode !== "perseus") {
                // Fix for Proxima Nova not being loaded on sandcastle.
                this.evaluate(addProximaNova);
            }
        }]);

        spook.then([{
            url: url,
            mode: mode,
            seed: seed,
            name: name,
            __dirname: __dirname,
        }, casperShoot]);

        spook.then(function () {
            this.emit('alldone');
        });
        spook.run();
    });
    spook.on('error', function (e, stack) {
        console.error('SPOOK ERROR:', e, stack);
    });
    spook.on('log', function (log) {
        console.log('SPOOK LOG: [' + log.level + ']', log.message);
    })
    spook.on('console', function (line) {
        console.log(line);
    });
    spook.on('alldone', function () {
        done();
    });
}

