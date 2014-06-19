/**
 * Some gymnastics to simplify the process of firing up a headless browser,
 * navigating to a URL, and then running some code in the correct context.
 *
 * The module is expected to export a single function, which will be executed
 * in the casper environment, with the `this` set to the casper object.
 *
 * @param string url the url to open to
 * @param string module the module, relative to this directory, to load &
 * execute (should export a function) once the browser is ready. This can't be
 * a function, because the module will actually be loaded in a different
 * runtime (casperjs) in a different thread. So don't expect to have any
 * shared global context...which you probably shouldn't have anyway.
 * @param array args the args to pass into the module's function
 * @param {fn(err)} done called when everything is finished. If there's an
 * error, it will be passed in. Otherwise it is called with no arguments.
 * @return void
 */

var Spook = require('spooky');
var debug = require('debug')('exicons:spook-wrap');

function spookWrap(url, module, args, done) {
    var spook = new Spook({
        casper: {
            logLevel: 'error',
            waitTimeout: 10000,
            viewportSize: {width: 1280, height: 1024}
        }
    }, function (e) {
        spook.start(url, [{
            __dirname: __dirname,
            args: args,
            module: module
        }, function() {
            this.echo('Current location is ' + this.getCurrentUrl(), 'info');
            require(__dirname + '/' + module).apply(this, args);
        }]);

        // this will only get called after all of the .thens in the required
        // module
        spook.then(function () {
            this.emit('alldone');
        });
        spook.run();
    });
    spook.on('error', function (e, stack) {
        console.error('For URL', url);
        console.error('SPOOK ERROR:', e, stack);
        spook.destroy();
        done(e);
    });
    spook.on('log', function (log) {
        console.log('SPOOK LOG: [' + log.level + ']', log.message);
    });
    spook.on('console', function (line) {
        debug(line);
    });
    var return_args = [];
    spook.on('return', function () {
        return_args = [].slice.call(arguments);
    });
    spook.on('alldone', function () {
        done.apply(null, [null].concat(return_args));
    });
}

module.exports = spookWrap;
