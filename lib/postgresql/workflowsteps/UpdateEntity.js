module.exports = function (nit, postgresql)
{
    return postgresql.defineWorkflowStep ("UpdateEntity")
        .field ("<entity>", "postgresql.Model", "The entity to be updated.", { exprAllowed: true })
        .field ("data", "any", "The model data.", { exprAllowed: true })
        .field ("cascade", "boolean", "Whether to update the related entities.", { exprAllowed: true })
        .field ("options", "postgresql.QueryOptions", "The query options.", { exprAllowed: true })
        .onRun (async function (ctx)
        {
            let self = this;

            self.entity.constructor.db = ctx.db;

            return await self.entity.update (self.data, self.cascade, self.options);
        })
    ;
};
