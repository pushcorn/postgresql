module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Select")
        .describe ("Select the rows that match the specifed criteria.")
        .defineInput (Input =>
        {
            Input
                .option ("<source>", "string", "The source table or model name.")
                .option ("[matches...]", "any", "The row matching criteria.", { kvp: true })
                .option ("otherClauses", "string", "The query clauses.")
                .option ("eager", "boolean", "Whether to fetch related entities.")
                .option ("queryOptions...", "any", "The query options.", { kvp: true })
            ;
        })
        .onRun (async function ({ db, input: { source, matches, otherClauses, eager, queryOptions } })
        {
            let Model = db.lookup (source, true);

            if (Model)
            {
                return await Model.select (matches.kvp, otherClauses, eager, queryOptions.kvp);
            }
            else
            {
                return await db.select (source, matches.kvp, otherClauses);
            }
        })
    ;
};
