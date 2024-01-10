module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("FetchAll")
        .describe ("Fetch all rows with a raw query.")
        .defineInput (Input =>
        {
            Input
                .option ("<statement>", "string", "The query to run.")
                .option ("[parameters...]", "any", "The query parameters.")
            ;
        })
        .onRun (async function ({ input: { statement, parameters }, db })
        {
            return await db.fetchAll (statement, ...parameters);
        })
    ;
};
