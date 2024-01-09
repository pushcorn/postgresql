module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Value")
        .describe ("Get the first column value of the selected row.")
        .defineInput (Input =>
        {
            Input
                .option ("<statement>", "string", "The query to run.")
                .option ("[parameters...]", "string", "The query parameters.")
            ;
        })
        .onRun (async function ({ db, input })
        {
            return await db.value (input.statement, ...input.parameters);
        })
    ;
};
