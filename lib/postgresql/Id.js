module.exports = function (nit, postgresql)
{
    return postgresql.defineModel ("postgresql.Id")
        .categorize ("postgresql.ids")
        .field ("[value]", "string")
        .staticMethod ("marshall", function (id)
        {
            return id instanceof nit.Object ? id.toPojo () : nit.clone (id);
        })
        .staticMethod ("registerTypeMapping", function (pgType)
        {
            postgresql.registerTypeMapping (this.name, pgType);

            return this;
        })
    ;
};
