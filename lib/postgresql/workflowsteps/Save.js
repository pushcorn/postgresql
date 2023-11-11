module.exports = function (nit, postgresql)
{
    return postgresql.defineWorkflowStep ("Save")
        .field ("<model>", "string", "The model name.", { exprAllowed: true })
        .field ("data", "any", "The model data.", { exprAllowed: true })
        .onRun (async function (ctx)
        {
            let self = this;
            let db = self.getDb (ctx);
            let Model = db.lookup (self.model);

            return await Model.new (self.data).save ();
        })
    ;
};
