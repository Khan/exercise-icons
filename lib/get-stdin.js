
/**
 * Get exercise data from STDIN in json format
 *
 * done(err, data)
 */
function getStdin(done) {
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

        done(null, exercises);
    });
}

module.exports = getStdin;
