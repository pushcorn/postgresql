module.exports = function (nit, postgresql)
{
    return postgresql.defineTask ("Fetch")
        .describe ("Fetch a single row with a raw query.")
        .field ("<statement>", "string", "The query to run.")
        .field ("[parameters...]", "string", "The query parameters.")
        .onRun (async function (ctx)
        {
            let self = this;

            return await ctx.db.fetch (self.statement, ...self.parameters);
        })
    ;
};