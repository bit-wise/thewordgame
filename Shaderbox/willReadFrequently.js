// Improve multiple readbacks performance by requesting
// a 2D context with `willReadFrequently: true` when none provided.
(function () {
    const _origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, attrs) {
        if (type === '2d') {
            // If caller didn't provide options, request willReadFrequently
            if (!attrs || attrs.willReadFrequently === undefined) {
                attrs = Object.assign({}, attrs, { willReadFrequently: true });
            }
        }
        return _origGetContext.call(this, type, attrs);
    };
})();