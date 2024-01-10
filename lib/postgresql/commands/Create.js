module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Create")
        .describe ("Create and save an entity.")
        .defineInput (Input =>
        {
            Input
                .option ("<model>", "string", "The model name.")
                .option ("[data...]", "any", "The model data.", { kvp: true })
                .option ("options...", "any", "The query options.", { kvp: true })
            ;
        })
        .onRun (async function ({ input: { model, data, options }, db })
        {
            let Model = db.lookup (model);

            return await Model.create (data.kvp, options.kvp);
        })
    ;
};
