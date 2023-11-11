module.exports = function (nit, postgresql)
{
    return postgresql.defineWorkflowStep ("SaveEntity")
        .field ("<entity>", "postgresql.Model", "The entity to be saved.", { exprAllowed: true })
        .field ("cascade", "boolean", "Whether to save the related entities.", { exprAllowed: true })
        .field ("options", "postgresql.QueryOptions", "The query options.", { exprAllowed: true })
        .onRun (async function (ctx)
        {
            let self = this;

            self.entity.constructor.db = self.getDb (ctx);

            return await self.entity.save (self.cascade, self.options);
        })
    ;
};
