module.exports = function (nit, postgresql)
{
    return postgresql.defineTask ("Query")
        .describe ("Query a PostgreSQL database.")
        .field ("<statement>", "string", "The query to run.")
        .field ("[parameters...]", "string", "The query parameters.")
        .onRun (async function (ctx)
        {
            let self = this;
            let result = await ctx.db.query (self.statement, ...self.parameters);

            if (result.command == "SELECT")
            {
                return result.rows;
            }
            else
            {
                return result.command + " " + result.rowCount;
            }
        })
    ;
};
