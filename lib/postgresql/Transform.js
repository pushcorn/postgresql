module.exports = function (nit)
{
    return nit.defineClass ("postgresql.Transform", "nit.Model.Transform")
        .categorize ()
        .method ("preMarshall", /* istanbul ignore next */ function (model, row) {}) // eslint-disable-line no-unused-vars
        .method ("postMarshall", /* istanbul ignore next */ function (model, row) {}) // eslint-disable-line no-unused-vars
        .method ("preUnmarshall", /* istanbul ignore next */ function (model, row) {}) // eslint-disable-line no-unused-vars
        .method ("postUnmarshall", /* istanbul ignore next */ function (model, row) {}) // eslint-disable-line no-unused-vars
    ;
};
