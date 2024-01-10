module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Find")
        .describe ("Find a matching row from a table.")
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
            return await db.find (table, matches.kvp, otherClauses);
        })
    ;
};
