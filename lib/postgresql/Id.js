module.exports = function (nit, postgresql)
{
    return postgresql.defineModel ("postgresql.Id")
        .categorize ("postgresql.ids")
        .field ("[value]", "string")
        .staticMethod ("marshall", function (id)
        {
            return nit.toPojo (id);
        })
        .staticMethod ("registerTypeMapping", function (pgType)
        {
            postgresql.registerTypeMapping (this.name, pgType);

            return this;
        })
    ;
};
