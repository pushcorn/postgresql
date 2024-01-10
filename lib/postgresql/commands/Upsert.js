module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Upsert")
        .describe ("Upsert a row into the specified table.")
        .defineInput (Input =>
        {
            Input
                .option ("<table>", "string", "The table to be updated.")
                .option ("<values...>", "any", "The values to be updated.", { kvp: true })
                .option ("matches...", "any", "The row matching criteria.", { kvp: true })
            ;
        })
        .onRun (async function ({ db, input: { table, values, matches } })
        {
            return await db.upsert (table, values.kvp, matches.kvp);
        })
    ;
};
