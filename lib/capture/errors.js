
module.exports = {
    NotFound: NotFound
};

function NotFound() {
    Error.apply(this, arguments);
}

NotFound.prototype = Object.create(Error.prototype);

