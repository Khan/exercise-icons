
var shootKhan = require('./shoot-khan.js');
var processMain = require('./process-main');

function khan(name, done) {
    shootKhan(name, function (err) {
        if (err) {
            return done(err);
        }
        processMain(name, name + '-0.png', done);
    });
}

module.exports = khan;
