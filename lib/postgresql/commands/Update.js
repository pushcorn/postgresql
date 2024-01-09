module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Update")
        .describe ("Update the rows that match the specified criteria.")
        .defineInput (Input =>
        {
            Input
                .option ("<table>", "string", "The table to be queried.")
                .option ("<values...>", "any", "The values to be updated.")
                .option ("matches...", "any", "The row matching criteria.")
            ;
        })
        .onRun (async function ({ db, input })
        {
            return await db.update (input.table,
                nit.parseKvp (input.values),
                nit.parseKvp (input.matches)
            );
        })
    ;
};
