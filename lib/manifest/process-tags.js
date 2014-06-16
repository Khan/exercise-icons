/**
 * Takes the output from
 * http://www.khanacademy.org/api/v1/assessment_items/tags, filters out the
 * non-common core tags, and returns a mapping of id => display_name.
 *
 * TODO(jared): should we just add a param to the endpoint to give us the data
 * we want in the format we want it? Might not be worth it...
 *
 * @param {array} data looks like [{
 *   "kind": str,
 *   "display_name": "Math.CC.blahblah",
 *   "id": "really long b64 id",
 *   "description": str
 * }, ...]
 * @param {string} prefix defaults to 'Math.CC.'. Filter out all tags that
 * don't start with the given prefix.
 *
 * @return {object} looks like {
 *   id: display_name,
 *   ...
 * }
 */

function processTags(data, prefix) {
    var tags = {};
    prefix = prefix || 'Math.CC.';
    data.forEach(function (tag) {
        if (tag.display_name.indexOf(prefix) !== 0) {
            return;
        }
        tags[tag.id] = tag.display_name;
    });
    return tags;
}

module.exports = processTags;
