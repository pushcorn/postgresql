module.exports = function (nit)
{
    return nit.defineCommand ("postgresql.commands.Query", "postgresql.Command")
        .describe ("Query a PostgreSQL database.")
        .defineInput (Input =>
        {
            Input
                .option ("<statement>", "string", "The query to run.")
                .option ("[parameters...]", "string", "The query parameters.")
            ;
        })
        .run (async function (ctx)
        {
            let { statement, parameters } = ctx.input;

            let result = await ctx.db.query (statement, ...parameters);

            if (result.command == "SELECT")
            {
                result.rows.forEach (r =>
                {
                    nit.log (r);
                });
            }
            else
            {
                nit.log (result.command, result.rowCount);
            }
        })
    ;
};
