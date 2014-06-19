
var shootKhan = require('./shoot-khan.js');
var processMain = require('./process-main');
var debug = require('debug')('exicons:khan');

function khan(name, dest, done) {
    debug('shooting khan', name, dest);
    shootKhan(name, dest, function (err) {
        if (err) {
            return done(err);
        }
        processMain(name, name + '-0.png', dest, done);
    });
}

module.exports = khan;
