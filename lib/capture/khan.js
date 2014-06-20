/**
 * @param string name the skill name
 * @param string dest ./build directory
 * @param fn done(err)
 */

var shootKhan = require('./shoot-khan.js');
var processMain = require('./process-main');
var debug = require('debug')('exicons:khan');

function khan(name, fileName, dest, done) {
    debug('shooting khan', name);
    shootKhan(name, fileName, dest, function (err) {
        if (err) {
            return done(err);
        }
        processMain(name, name + '-0.png', dest, done);
    });
}

module.exports = khan;
