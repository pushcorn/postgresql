module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Select")
        .describe ("Select the rows that match the specifed criteria.")
        .defineInput (Input =>
        {
            Input
                .option ("<table>", "string", "The table to be queried.")
                .option ("matches...", "any", "The row matching criteria.")
                .option ("otherClauses", "string", "The query clauses.")
            ;
        })
        .onRun (async function ({ db, input })
        {
            return await db.select (input.table,
                nit.parseKvp (input.matches),
                input.otherClauses
            );
        })
    ;
};
