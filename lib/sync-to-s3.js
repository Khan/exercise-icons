
var path = require('path');
var s3 = require('s3');
var glob = require('glob');
var fs = require('fs');

var runAll = require('./run-all');

var OUT = path.join(__dirname, '../build'); ///projectTypes.json');

function syncToS3(key, secret, bucket, done) {
    s3upload(key, secret, bucket, OUT, '', done);
}

function s3upload(key, secret, bucket, local, remote, done) {
    glob(path.join(local, '**/*'), function (err, files) {
        if (err) {
            return done(new Error('error reading from local dir: ' + local + ' : ' + err.message));
        }
        console.log('uploading', files.length, 'files');
        var client = s3.createClient({
            s3RetryCount: 3,
            s3RetryDelay: 1000,
            s3Options: {
                accessKeyId: key,
                secretAccessKey: secret
            }
        });
        var tasks = files
          .filter(function (file) {
              return fs.statSync(file).isFile();
          })
          .map(function (file) {
            return function (next) {
                var rel = path.join(remote, path.relative(local, file));
                var u = client.uploadFile({
                    localFile: file,
                    s3Params: {
                        Bucket: bucket,
                        Key: rel,
                        ACL: 'public-read'
                    }
                });
                u.on('error', function (err) {
                    next('Failed to upload ' + file + ' ' + err);
                });
                u.on('end', function () {
                    next();
                });
            };
        });

        runAll(tasks, done);
    });
}

module.exports = syncToS3;
