module.exports = function (nit)
{
    return nit.defineClass ("postgresql.Transform", "nit.Model.Transform")
        .categorize ("postgresql.transforms")
        .lifecycleMethod ("preMarshall", null, /* istanbul ignore next */ function (entity, row, ctx) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("postMarshall", null, /* istanbul ignore next */ function (entity, row, ctx) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("preUnmarshall", null, /* istanbul ignore next */ function (row, entity, options) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("postUnmarshall", null, /* istanbul ignore next */ function (row, entity, options) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("preInsert", null, /* istanbul ignore next */ function (ctx) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("postInsert", null, /* istanbul ignore next */ function (ctx) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("preUpdate", null, /* istanbul ignore next */ function (ctx) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("postUpdate", null, /* istanbul ignore next */ function (ctx) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("preDelete", null, /* istanbul ignore next */ function (ctx) {}) // eslint-disable-line no-unused-vars
        .lifecycleMethod ("postDelete", null, /* istanbul ignore next */ function (ctx) {}) // eslint-disable-line no-unused-vars
    ;
};
