
var fs = require('fs');
var gm = require('gm');
var path = require('path');
var debug = require('debug')('exicons:post-process');

function postProcess(name, dest, done) {
    // resize down to 412x412 (maintaining aspect ratio) only if it is larger
    // than that. ^ means use the numbers as minima, not maxima.
    var infile = path.join(dest, 'raw', name);
    var outfile = path.join(dest, 'types', name);
    debug('processing', infile, outfile);
    if (!fs.existsSync(infile)) {
        console.error('Image not there... screenshot must have failed', infile);
        return done(new Error('Image not available for processing'));
    }
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

module.exports = postProcess;
