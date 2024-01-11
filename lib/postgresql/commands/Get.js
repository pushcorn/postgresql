module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Get")
        .describe ("Get a row by primary key.")
        .defineInput (Input =>
        {
            Input
                .option ("<model>", "string", "The source model name.")
                .option ("[values...]", "any", "The primary key values.")
            ;
        })
        .onRun (async function ({ db, input: { model, values } })
        {
            let Model = db.lookup (model);

            return await Model.get (...values);
        })
    ;
};
