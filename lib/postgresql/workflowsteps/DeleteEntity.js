module.exports = function (nit, postgresql)
{
    return postgresql.defineWorkflowStep ("DeleteEntity")
        .field ("<entity>", "postgresql.Model", "The entity to be deleted.", { exprAllowed: true })
        .field ("cascade", "boolean", "Whether to delete the related entities.", { exprAllowed: true })
        .field ("options", "postgresql.QueryOptions", "The query options.", { exprAllowed: true })
        .onRun (async function (ctx)
        {
            let self = this;

            self.entity.constructor.db = self.getDb (ctx);

            return await self.entity.delete (self.cascade, self.options);
        })
    ;
};
