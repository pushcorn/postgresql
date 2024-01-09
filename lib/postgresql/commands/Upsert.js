module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Upsert")
        .describe ("Upsert a row into the specified table.")
        .defineInput (Input =>
        {
            Input
                .option ("<table>", "string", "The table to be updated.")
                .option ("<values...>", "any", "The values to be updated.")
                .option ("matches...", "any", "The row matching criteria.")
            ;
        })
        .onRun (async function ({ db, input })
        {
            return await db.upsert (input.table,
                nit.parseKvp (input.values),
                nit.parseKvp (input.matches)
            );
        })
    ;
};
