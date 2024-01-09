module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Find")
        .describe ("Find a matching row from a table.")
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
            return await db.find (input.table,
                nit.parseKvp (input.matches),
                input.otherClauses
            );
        })
    ;
};
