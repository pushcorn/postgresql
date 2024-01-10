module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Delete")
        .describe ("Delete the rows that match the specified criteria.")
        .defineInput (Input =>
        {
            Input
                .option ("<table>", "string", "The table to be queried.")
                .option ("[matches...]", "any", "The row matching criteria.", { kvp: true })
            ;
        })
        .onRun (async function ({ db, input: { table, matches } })
        {
            return await db.delete (table, matches.kvp);
        })
    ;
};
