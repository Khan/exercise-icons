/**
 * Executed in the browser.
 *
 * This just ensures that the proxima nova font is loaded, which apparently
 * doesn't happen in the dev pages sometimes.
 */
module.exports = function() {
    var newStyle = document.createElement('style');
    newStyle.appendChild(document.createTextNode(
        "@font-face {" + 
        "    font-family: 'Proxima Nova';" + 
        "    src: url('https://www.kastatic.org/fonts/ProximaNova-Reg-webfont.woff') format('woff');" + 
        "    font-weight: normal;" + 
        "    font-style: normal;" + 
        "}" + 
        "" + 
        "@font-face {" + 
        "    font-family: 'Proxima Nova';" + 
        "    src: url('https://www.kastatic.org/fonts/ProximaNova-Bold-webfont.woff') format('woff');" + 
        "    font-weight: bold;" + 
        "    font-style: normal;" + 
        "}" + 
        "" + 
        "@font-face {" + 
        "    font-family: 'Proxima Nova Bold';" + 
        "    src: url('https://www.kastatic.org/fonts/ProximaNova-Bold-webfont.woff') format('woff');" + 
        "    font-weight: normal;" + 
        "    font-style: normal;" + 
        "}" +
        "body {" +
        "   font-family: 'Proxima Nova';" +
        "}"));
    document.head.appendChild(newStyle);
};

