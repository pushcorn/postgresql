module.exports = function (nit, postgresql)
{
    return postgresql.defineApiPlugin ("ValidateEntityId")
        .field ("<model>", "string", "The model type.")
        .field ("[field]", "string", "The ID field name.", "id")
        .onPreDispatch (async function (api, ctx)
        {
            let { model, field } = this;
            let Model = ctx.db.lookup (model);
            let id = ctx.request[field];
            let job = id && (await Model.get (id));

            if (job)
            {
                ctx.registerObject (job);
            }
            else
            {
                throw 404; // eslint-disable-line no-throw-literal
            }
        })
    ;
};
