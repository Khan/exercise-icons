#!/usr/bin/env node

/**
 * Given arguments, do great things.
 *
 * See usage.txt for options
 */

var path = require('path');

var makeOptions = require('./make-options');
var exerciseIcons = require('../lib');
var ensureDirs = require('./ensure-dirs');

var options = makeOptions(process.argv.slice(2));

var BASE = path.join(__dirname, '../build');
ensureDirs([
    BASE,
    BASE + '/small',
    BASE + '/working',
    BASE + '/raw',
    BASE + '/mastered',
    BASE + '/struggling',
    BASE + '/types',
    BASE + '/thumbs'
], function (err) {
    if (err) {
        console.warn('Failed to create build directories');
        console.log(err, err.stack);
        process.exit(1);
    }

    exerciseIcons(options, function(err) {
        if (err) {
            console.error('Script failed! In some way...');
            console.error(err);
            process.exit(1);
        }
        if (!options.upload) {
            process.exit(0);
        }
    });
});
