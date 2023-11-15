module.exports = function (nit, postgresql)
{
    return postgresql.defineWorkflowStep ("NewEntity")
        .field ("<model>", "string", "The model name.", { exprAllowed: true })
        .field ("data", "any", "The entity data.", { exprAllowed: true })
        .onRun (async function (ctx)
        {
            let self = this;
            let Model = ctx.db.lookup (self.model);

            return Model.new (self.data);
        })
    ;
};
