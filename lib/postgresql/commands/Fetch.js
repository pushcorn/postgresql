module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Fetch")
        .describe ("Fetch a single row with a raw query.")
        .defineInput (Input =>
        {
            Input
                .option ("<statement>", "string", "The query to run.")
                .option ("[parameters...]", "any", "The query parameters.")
            ;
        })
        .onRun (async function ({ db, input: { statement, parameters } })
        {
            return await db.fetch (statement, ...parameters);
        })
    ;
};
