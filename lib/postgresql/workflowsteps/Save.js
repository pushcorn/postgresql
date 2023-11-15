module.exports = function (nit, postgresql)
{
    return postgresql.defineWorkflowStep ("Save")
        .field ("<model>", "string", "The model name.", { exprAllowed: true })
        .field ("data", "any", "The model data.", { exprAllowed: true })
        .onRun (async function (ctx)
        {
            let self = this;
            let Model = ctx.db.lookup (self.model);

            return await Model.new (self.data).save ();
        })
    ;
};
