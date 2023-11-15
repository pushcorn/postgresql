module.exports = function (nit, postgresql)
{
    return postgresql.defineWorkflowStep ("Get")
        .field ("<model>", "string", "The model name.", { exprAllowed: true })
        .field ("[values...]", "any", "The primary key values.", { exprAllowed: true })
        .onRun (async function (ctx)
        {
            let self = this;
            let Model = ctx.db.lookup (self.model);

            return await Model.get (...self.values);
        })
    ;
};
