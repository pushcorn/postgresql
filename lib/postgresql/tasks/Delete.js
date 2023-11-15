module.exports = function (nit, postgresql)
{
    return postgresql.defineTask ("Delete")
        .describe ("Delete the rows that match the specified criteria.")
        .field ("<table>", "string", "The table to be queried.")
        .field ("matches...", "any", "The row matching criteria.")
        .onRun (async function (ctx)
        {
            let self = this;

            return await ctx.db.delete (self.table,
                nit.parseKvp (self.matches)
            );
        })
    ;
};
