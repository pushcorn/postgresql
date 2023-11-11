module.exports = function (nit, postgresql)
{
    return postgresql.defineWorkflowStep ("NewEntity")
        .field ("<model>", "string", "The model name.", { exprAllowed: true })
        .field ("data", "any", "The entity data.", { exprAllowed: true })
        .onRun (async function (ctx)
        {
            let self = this;
            let db = self.getDb (ctx);
            let Model = db.lookup (self.model);

            return Model.new (self.data);
        })
    ;
};
