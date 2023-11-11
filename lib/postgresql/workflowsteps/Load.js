module.exports = function (nit, postgresql)
{
    return postgresql.defineWorkflowStep ("Load")
        .field ("<model>", "string", "The model name.", { exprAllowed: true })
        .field ("matches", "object", "The fields to be matched.", { exprAllowed: true })
        .field ("otherClauses", "string", "Other query clauses to use.", { exprAllowed: true })
        .field ("options", "postgresql.QueryOptions", "The query options.", { exprAllowed: true })
        .onRun (async function (ctx)
        {
            let self = this;
            let db = self.getDb (ctx);
            let Model = db.lookup (self.model);

            return await Model.load (nit.parseKvp (self.matches), self.otherClauses, self.options);
        })
    ;
};
