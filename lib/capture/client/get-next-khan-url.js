/**
 * Executed in the browser.
 *
 * This finds the next KhanExercise item to be executed, and returns the
 * corresponding URL. This is *very sensitive*, and will break if we change
 * the way links to project_types are displayed.
 */
module.exports = function(currIdx, seed) {
    if ($("#debug p div").children("a").length > currIdx) {
        return $("#debug p div").children("a")[currIdx].href +
            "&seed=" + seed;
    }
    return null;
};
