module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Delete")
        .describe ("Delete the rows that match the specified criteria.")
        .defineInput (Input =>
        {
            Input
                .option ("<source>", "string", "The source table or model name.")
                .option ("[matches...]", "any", "The row matching criteria.", { kvp: true })
                .option ("cascade", "boolean", "Whether to delete the related entities.")
                .option ("queryOptions...", "any", "The query options.", { kvp: true })
            ;
        })
        .onRun (async function ({ db, input: { source, matches, cascade, queryOptions } })
        {
            let Model = db.lookup (source, true);

            if (Model)
            {
                return await (await Model.load (matches.kvp)).delete (cascade, queryOptions.kvp);
            }
            else
            {
                return await db.delete (source, matches.kvp);
            }
        })
    ;
};
