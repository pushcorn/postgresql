module.exports = function (nit, postgresql)
{
    return postgresql.defineWorkflowStep ("InsertEntity")
        .field ("<entity>", "postgresql.Model", "The entity to be inserted.", { exprAllowed: true })
        .field ("cascade", "boolean", "Whether to insert the related entities.", { exprAllowed: true })
        .field ("options", "postgresql.QueryOptions", "The query options.", { exprAllowed: true })
        .onRun (async function (ctx)
        {
            let self = this;

            self.entity.constructor.db = self.getDb (ctx);

            return await self.entity.insert (self.cascade, self.options);
        })
    ;
};
