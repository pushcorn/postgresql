module.exports = function (nit, postgresql)
{
    return postgresql.defineTask ("Query")
        .describe ("Query a PostgreSQL database.")
        .field ("<statement>", "string", "The query to run.")
        .field ("[parameters...]", "string", "The query parameters.")
        .onRun (async function (ctx)
        {
            let self = this;
            let db = self.getDb (ctx);
            let result = await db.query (self.statement, ...self.parameters);

            if (result.command == "SELECT")
            {
                result.rows.forEach (r =>
                {
                    nit.inspect (r);
                });
            }
            else
            {
                nit.inspect (result.command, result.rowCount);
            }
        })
    ;
};
