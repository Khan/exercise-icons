/**
 * Evaluated in the web page. Finds an interesting box with the given width,
 * and height to be screenshotted.
 *
 * If nothing useful can be found, zero is returned, and the workarea is
 * shrunk down to have a width of `width`.
 * Otherwise an object is returned {top:, left:, width:, height:}
 */
module.exports = function(width, height) {

    // this must be embedded, because the outer function is being injected
    // into the browser's javascript runtime.
    var boundingBox = function(items) {
        var box = {
            minX: 1.0 / 0,
            minY: 1.0 / 0,
            maxX: 0,
            maxY: 0
        };

        _.each(items, function(item) {
            var bb = {
                x: $(item).offset().left,
                y: $(item).offset().top,
                width: $(item).width(),
                height: $(item).height()
            };

            console.log(item + ": " + JSON.stringify(bb));

            box = {
                minX: Math.min(bb.x, box.minX),
                minY: Math.min(bb.y, box.minY),
                maxX: Math.max(bb.x + bb.width, box.maxX),
                maxY: Math.max(bb.y + bb.height, box.maxY)
            };
        });

        return {
            left: box.minX,
            top: box.minY,
            width: box.maxX - box.minX,
            height: box.maxY - box.minY
        };
    };

    var interesting_things = [
        "img",
        "table",
        ".graphie",
        // Text nodes
        ".paragraph span:not(:has(*))",
        ".perseus-interactive" /*,
        ".perseus-widget-plotter",
        ".perseus-widget-interactive-graph",
        ".perseus-widget-expression",
        ".perseus-widget-measurer",
        ".perseus-widget-interactive-number-line" */
    ];

    // We need '?debug=1' to see the problem types, but we don't
    // want the debug borders.
    $("body").removeClass("debug");

    var $pretties = $();
    interesting_things.forEach(function(name) {
        $pretties = $pretties.add('#workarea ' + name);
    });
    var bb = boundingBox($pretties);

    if (bb.width < 60 || bb.height < 40) {
        document.getElementById("workarea").style.width =
            width + "px";
        return 0;
    }

    return bb;
};
