module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Value")
        .describe ("Get the first column value of the selected row.")
        .defineInput (Input =>
        {
            Input
                .option ("<statement>", "string", "The query to run.")
                .option ("[parameters...]", "any", "The query parameters.")
            ;
        })
        .onRun (async function ({ db, input: { statement, parameters } })
        {
            return await db.value (statement, ...parameters);
        })
    ;
};
