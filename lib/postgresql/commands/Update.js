module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Update")
        .describe ("Update the rows that match the specified criteria.")
        .defineInput (Input =>
        {
            Input
                .option ("<table>", "string", "The table to be queried.")
                .option ("<values...>", "any", "The values to be updated.", { kvp: true })
                .option ("matches...", "any", "The row matching criteria.", { kvp: true })
            ;
        })
        .onRun (async function ({ db, input: { table, values, matches } })
        {
            return await db.update (table, values.kvp, matches.kvp);
        })
    ;
};
