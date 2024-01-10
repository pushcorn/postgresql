module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Select")
        .describe ("Select the rows that match the specifed criteria.")
        .defineInput (Input =>
        {
            Input
                .option ("<table>", "string", "The table to be queried.")
                .option ("[matches...]", "any", "The row matching criteria.", { kvp: true })
                .option ("otherClauses", "string", "The query clauses.")
            ;
        })
        .onRun (async function ({ db, input: { table, matches, otherClauses } })
        {
            return await db.select (table, matches.kvp, otherClauses);
        })
    ;
};
