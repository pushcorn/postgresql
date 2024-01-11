module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Find")
        .describe ("Find a matching row from a table.")
        .defineInput (Input =>
        {
            Input
                .option ("<source>", "string", "The source table or model name.")
                .option ("[matches...]", "any", "The row matching criteria.", { kvp: true })
                .option ("otherClauses", "string", "The query clauses.")
                .option ("queryOptions...", "any", "The query options.", { kvp: true })
            ;
        })
        .onRun (async function ({ db, input: { source, matches, otherClauses, queryOptions } })
        {
            let Model = db.lookup (source, true);

            if (Model)
            {
                return await Model.find (matches.kvp, otherClauses, queryOptions.kvp);
            }
            else
            {
                return await db.find (source, matches.kvp, otherClauses);
            }
        })
    ;
};
