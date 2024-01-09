module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Delete")
        .describe ("Delete the rows that match the specified criteria.")
        .defineInput (Input =>
        {
            Input
                .option ("<table>", "string", "The table to be queried.")
                .option ("matches...", "any", "The row matching criteria.")
            ;
        })
        .onRun (async function (ctx)
        {
            let { table, matches } = ctx.input;

            return await ctx.db.delete (table, nit.parseKvp (matches));
        })
    ;
};
