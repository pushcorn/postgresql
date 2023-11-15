module.exports = function (nit, postgresql)
{
    return postgresql.defineTask ("Upsert")
        .describe ("Upsert a row into the specified table.")
        .field ("<table>", "string", "The table to be updated.")
        .field ("<values...>", "any", "The values to be updated.")
        .field ("matches...", "any", "The row matching criteria.")
        .onRun (async function (ctx)
        {
            let self = this;

            return await ctx.db.upsert (self.table,
                nit.parseKvp (self.values),
                nit.parseKvp (self.matches)
            );
        })
    ;
};
