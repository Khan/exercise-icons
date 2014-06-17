#!/usr/bin/env node

var debug = require('debug')('exicons:cli');
var exerciseIcons = require('../lib')
var subarg = require('subarg')
var fs = require('fs');

var args = subarg(process.argv.slice(2));
debug('args', args);

main(args);

function main(args) {
    if (args.h || args.help) {
        console.log(fs.readFileSync(__dirname + '/usage.txt').toString());
        process.exit(0);
    }

    var file = args.f || args.file;
    var upload = args.u || args.upload;
    var manifest = args.m || args.manifest;

    var s3 = {};

    if (upload) {
        var key = process.env.S3_KEY;
        var secret = process.env.S3_SECRET;
        var bucket = process.env.S3_BUCKET;
        if (!key || !secret || !bucket) {
            console.error("S3 Env variables not set up correctly. S3_KEY and S3_SECRET and S3_BUCKET");
            process.exit(1);
        }
        s3 = {
            key: key,
            secret: secret,
            bucket: bucket
        };
    }
    var options = {
        justManifest: manifest,
        upload: upload,
        s3: s3
    }
    if (file === '-') {
        return getStdin(options);
    }

    var exercises = null;
    if (file) {
        try {
            exercises = require(path.resolve(file));
        } catch (e) {
            console.error(e);
            console.error('Unable to read file ' + file + '. Aborting.');
            process.exit(2);
        }
    }
    run(exercises, options);
}

function getStdin(options) {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    var total = '';
    process.stdin.on('data', function (data) {
        total += data;
    });
    process.stdin.on('end', function () {
        var exercises = null;
        try {
            exercises = JSON.parse(total);
        } catch (e) {
            console.error("Failed to parse JSON input", e.message);
            process.exit(3);
        }
        run(exercises, options);
    });
}

function run(exercises, options) {
    debug('exercises', exercises);
    debug('options', options);
    exerciseIcons(exercises, options, function (err) {
        if (err) {
            console.log(err, err.stack);
        }
        console.log('fin!');
    });
}

