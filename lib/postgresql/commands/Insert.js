module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Insert")
        .describe ("Insert a row to the specified table.")
        .defineInput (Input =>
        {
            Input
                .option ("<table>", "string", "The table to be inserted.")
                .option ("[values...]", "any", "The values to be inserted.", { kvp: true })
            ;
        })
        .onRun (async function ({ db, input: { table, values } })
        {
            return await db.insert (table, values.kvp);
        })
    ;
};
