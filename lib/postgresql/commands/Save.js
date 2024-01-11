module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("Save")
        .describe ("Save the model data.")
        .defineInput (Input =>
        {
            Input
                .option ("<model>", "string", "The model name.")
                .option ("data...", "any", "The model data.", { kvp: true })
            ;
        })
        .onRun (async function ({ db, input: { model, data } })
        {
            let Model = db.lookup (model);

            return await Model.new (data.kvp).save ();
        })
    ;
};
