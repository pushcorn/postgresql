module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("FetchAll")
        .describe ("Fetch all rows with a raw query.")
        .defineInput (Input =>
        {
            Input
                .option ("<statement>", "string", "The query to run.")
                .option ("[parameters...]", "string", "The query parameters.")
            ;
        })
        .onRun (async function (ctx)
        {
            let { statement, parameters } = ctx.input;

            return await ctx.db.fetchAll (statement, ...parameters);
        })
    ;
};
