module.exports = function (nit, postgresql)
{
    return postgresql.defineWorkflowStep ("LoadEntity")
        .field ("<model>", "string", "The model name.", { exprAllowed: true })
        .field ("matches", "object", "The fields to be matched.", { exprAllowed: true })
        .field ("otherClauses", "string", "Other query clauses to use.", { exprAllowed: true })
        .field ("options", "postgresql.QueryOptions", "The query options.", { exprAllowed: true })
        .onRun (async function (ctx)
        {
            let self = this;
            let Model = ctx.db.lookup (self.model);

            return await Model.load (self.matches, self.otherClauses, self.options);
        })
    ;
};
