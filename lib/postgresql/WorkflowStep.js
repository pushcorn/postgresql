module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("postgresql.WorkflowStep", "nit.WorkflowStep"))
        .k ("db")
        .categorize ("postgresql.workflowsteps")
        .use ("postgresql.Database")
        .method ("getDb", function (ctx)
        {
            let db = ctx[Self.kDb];

            if (!db)
            {
                db = Self.Database.get (ctx);

                ctx.workflow.once ("complete", db.disconnect.bind (db));
            }

            return ctx[Self.kDb] = db;
        })
    ;
};
