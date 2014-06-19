/**
 * Get the tags data from the KA api
 */

var request = require('superagent');

function getTags(next) {
    request.get('http://www.khanacademy.org/api/v1/assessment_items/tags')
        .end(function (err, res) {
            next(err, res.body);
        });
}

module.exports = getTags;

/* */
module.exports = function (next) {
    next(null, require('../../data/tags.json'));
};
/* */
