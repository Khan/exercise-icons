/**
 * Evaluated in the web page. Finds an interesting box with the given width,
 * height, and mode (?) to be screenshotted.
 *
 * If nothing useful can be found, zero is returned, and the workarea is
 * shrunk down to have a width of `width`.
 * Otherwise an object is returned {top:, left:, width:, height:}
 */
module.exports = function(width, height, mode) {

    // this must be embedded, because the outer function is being injected
    // into the browser's javascript runtime.
    var boundingBox = function(items) {
        var maxX, maxY, minX, minY;
        function reset() {
            maxX = 0;
            maxY = 0;
            minX = 10000;
            minY = 10000;
        }
        reset();
        _.each(items, function(item) {
            var bb = {
                x: $(item).offset().left,
                y: $(item).offset().top,
                width: $(item).width(),
                height: $(item).height()
            };
            if (bb.width > 100 && bb.height > 100 &&
                    bb.height/bb.width > 0.75 &&
                    bb.height/bb.width < 1.5 ) {
                reset();
            } else if (maxX && maxX + bb.x + bb.width  - maxX > 50) {
                return;
            }
            minX = Math.min(bb.x, minX);
            minY = Math.min(bb.y, minY);
            maxX = Math.max(bb.x + bb.width, maxX);
            maxY = Math.max(bb.y + bb.height, maxY);
        });
        var ret = {
            left: minX,
            top: minY,
            width: maxX - minX,
            height: maxY - minY
        };
        return ret;
    }

    var interesting_things = [
        "table",
        ".graphie",
        ".perseus-widget-plotter",
        ".perseus-widget-interactive-graph",
        ".perseus-widget-expression",
        ".perseus-widget-measurer",
        ".draggy-boxy-thing",
        ".perseus-widget-interactive-number-line"
    ];

    // We need '?debug=1' to see the problem types, but we don't
    // want the debug borders.
    $("body").removeClass("debug");

    var $pretties = $("#workarea img");
    interesting_things.forEach(function (name) {
        $pretties = $pretties.add('#workarea ' + name);
    });
    var bb = boundingBox($pretties);

    if (bb.width < 60 || bb.height < 40) {
        document.getElementById("workarea").style.width =
            width + "px";
        return 0;
    }

    return bb;
}
