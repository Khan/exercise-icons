#!/usr/bin/env node

/**
 * Given arguments, do great things.
 *
 * See usage.txt for options
 */

var makeOptions = require('./make-options');
var exerciseIcons = require('../lib');

var options = makeOptions(process.argv.slice(2));

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
