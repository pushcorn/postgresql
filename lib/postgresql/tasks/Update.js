module.exports = function (nit, postgresql)
{
    return postgresql.defineTask ("Update")
        .describe ("Update the rows that match the specified criteria.")
        .field ("<table>", "string", "The table to be queried.")
        .field ("<values...>", "any", "The values to be updated.")
        .field ("matches...", "any", "The row matching criteria.")
        .onRun (async function (ctx)
        {
            let self = this;

            return await ctx.db.update (self.table,
                nit.parseKvp (self.values),
                nit.parseKvp (self.matches)
            );
        })
    ;
};
