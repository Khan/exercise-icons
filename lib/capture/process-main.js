
/**
 * Process the "main" image for a skill (for use in the email, dashboard,
 * etc), creating smaller, circular, and colored images.
 *
 * input {dest}/raw/{rawname}
 * output {dest}/small/{name}.png
 * ... and lots of others
 *
 * @param string name the skill name
 * @param string rawname the filename of the `problem type` image
 * @param string dest the /build directory
 */

var fs = require('fs');
var gm = require('gm');
var path = require('path');
var async = require('async');
var debug = require('debug')('exicons:process-main');

function processMain(name, rawname, dest, done) {
    var mainName = name + '.png';
    var small = path.join(dest, 'small', mainName);
    var raw = path.join(dest, 'raw', rawname);
    if (!fs.existsSync(raw)) {
        console.error('Image not there... screenshot must have failed ' + raw);
        return done(new Error('Image not available for processing: ' + rawname));
    }
    debug('processing', name, raw, small);
    smallify(raw, small, function (err) {
        if (err) {
            console.error('Error in smallifying', name, rawname, dest);
            console.error(err.message, err.stack);
            return done(err);
        }
        // create the colored circle ones
        async.parallel([
            colorfy.bind(null, small, dest, mainName, 'struggling'),
            colorfy.bind(null, small, dest, mainName, 'mastered'),
            colorfy.bind(null, small, dest, mainName, 'working'),
        ], function (err) {
            if (err) {
                console.error('Error in colorifying', name, rawname, dest);
                console.error(err.message, err.stack);
            }
            done(err);
        });
    });
}

function smallify(infile, outfile, done) {
    var size = 70;
    var tmp = gm(infile)
        .resize(70, 70, '>^')
        .background('white')
        .stream();
    // crop down to 70x70
    tmp = gm(tmp)
        .borderColor('white')
        .trim()
        .background('white')
        .extent(size, size)
        .stream();
    // if the image is smaller than 70x70, this will center the
    // image over a white background.
    gm(tmp)
        .borderColor('white')
        .trim()
        .gravity('Center')
        .background('white')
        .extent(size, size)
        .write(outfile, function (err) {
            done(err);
        });
}

function colorfy(fname, dest, name, color, next) {
    var overlay = path.join(__dirname, '../../assets', color + '.png');
    var outfile = path.join(dest, color, name);
    gm().command('composite')
    .out(overlay)
    .out(fname)
    .write(outfile, next);
}

module.exports = processMain;
