module.exports = function (nit, postgresql)
{
    return postgresql.defineTask ("FetchAll")
        .describe ("Fetch all rows with a raw query.")
        .field ("<statement>", "string", "The query to run.")
        .field ("[parameters...]", "string", "The query parameters.")
        .onRun (async function (ctx)
        {
            let self = this;

            return await ctx.db.fetchAll (self.statement, ...self.parameters);
        })
    ;
};
