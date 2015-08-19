
/**
 * resize and squarify the raw images into 256x256 ones.
 *
 * input {dest}/raw/{name}
 * output {dest}/types/{name}
 */

var fs = require('fs');
var gm = require('gm');
var path = require('path');
var debug = require('debug')('exicons:post-process');

function processTypes(infile, outfile, done) {
    // resize down to 412x412 (maintaining aspect ratio) only if it is larger
    // than that. ^ means use the numbers as minima, not maxima.
    var tmp = gm(infile)
        .resize(412, 412, '>^')
        .background('white')
        .stream();
    // crop down to 256x256
    tmp = gm(tmp)
        .borderColor('white')
        .trim()
        .background('white')
        .extent(256, 256)
        .stream();
    // if the image is smaller than 256x256, this will center the
    // image over a white background.
    gm(tmp)
        .borderColor('white')
        .trim()
        .gravity('Center')
        .background('white')
        .extent(256, 256)
        .write(outfile, function (err) {
            if (err) {
                console.error('Error in post processing', name, dest);
                console.error(err.message, err.stack);
            }
            done(err);
        });
}

var PROPORTION = 16 / 9;
var BORDER = 10;
var _BACKGROUND = "#FDFDFD";

function processThumbs(infile, outfile, done) {
    var file = fs.readFileSync(infile);

    // Render the image, trimmed, so we can observe the size.
    var image = gm(gm(file).trim().stream());
    image.size(function(err, size) {
        if (err) {
            done(err);
        }

        var width = size.width;
        var height = size.height;

        // Figure out the correct 16/9 size for the image.
        if (width / height > PROPORTION) {
            // too wide
            width = width + 2 * BORDER;
            height = width / PROPORTION;
        } else {
            // too tall (or correct)
            height = height + 2 * BORDER;
            width = height * PROPORTION;
        }

        // Re-trim the original file, crop it, and write it.
        gm(file)
            .trim()
            .gravity('Center')
            .background(_BACKGROUND)
            .extent(width, height)
            .write(outfile, function(err) {
                done(err);
            });
    });
}

function postProcess(name, dest, done) {
    var infile = path.join(dest, 'raw', name);
    var outTypes = path.join(dest, 'types', name);
    var outThumbs = path.join(dest, 'thumbs', name);
    debug('processing', infile);

    if (!fs.existsSync(infile)) {
        console.error('Image not there... screenshot must have failed', infile);
        return done(new Error('Image not available for processing'));
    }

    processTypes(infile, outTypes, function(err) {
        processThumbs(infile, outThumbs, done);
    });
}

module.exports = postProcess;
