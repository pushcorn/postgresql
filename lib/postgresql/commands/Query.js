module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Query")
        .describe ("Query a PostgreSQL database.")
        .defineInput (Input =>
        {
            Input
                .option ("<statement>", "string", "The query to run.")
                .option ("[parameters...]", "any", "The query parameters.")
            ;
        })
        .onRun (async function ({ db, input: { statement, parameters } })
        {
            let result = await db.query (statement, ...parameters);

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
