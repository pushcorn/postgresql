module.exports = function (nit, postgresql, Self)
{
    return (Self = postgresql.defineId ("Uuid"))
        .registerTypeMapping ("UUID")
        .field ("[value]", "string", { columnDefval: "UUID_GENERATE_V4 ()" })
        .staticMethod ("marshall", async function (model, ctx)
        {
            if (ctx?.action == "insert" && !model.value)
            {
                model.value = await this.db.value ("SELECT UUID_GENERATE_V4 ()");
            }

            return await Self.superclass.marshall (model, ctx);
        })
    ;
};
