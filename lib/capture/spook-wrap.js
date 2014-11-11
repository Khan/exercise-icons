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
var clc = require('cli-color');
var _ = require('lodash');

var NotFound = require('./errors').NotFound;

function spookWrap(url, module, args, done) {
    done = _.once(done);
    var spook = new Spook({
        casper: {
            logLevel: 'error',
            waitTimeout: 30000,
            viewportSize: {width: 1280, height: 1024},
            onPageInitialized: function(page) {
                page.injectJs('lib/capture/client/polyfill.js');
            }
        }
    }, function (e) {
        if (e) return done(e);

        spook.start(url, [{
            __dirname: __dirname,
            args: args,
            module: module
        }, function() {
            if (this.currentHTTPStatus === 404) {
                return this.emit('not found');
            }
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
    spook.on('http.status.404', function (resource) {
        this.emit('not found', resource.url);
    });
    spook.on('page.error', function (e, stack) {
        console.error(clc.red('page error:'), JSON.stringify(e));
        console.error(stack);
    });
    spook.on('error', function (e) {
        console.error(clc.red('SPOOK ERROR:'), e.message, url);
        spook.destroy();
        done(e);
    });
    spook.on('log', function (log) {
        console.log(clc.red('SPOOK LOG: [' + log.level + ']'), log.message);
        spook.destroy();
        done(new Error('permissions issue'));
    });
    spook.on('console', function (line) {
        debug(line);
    });
    spook.on('not found', function () {
        console.error(clc.blue('40404'), url);
        spook.destroy();
        done(new NotFound('Not found: ' + url));
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
