module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.WorkflowStep", "nit.WorkflowStep"))
        .categorize ("postgresql.workflowsteps")
        .use ("postgresql.Database")
        .method ("getDb", function (ctx)
        {
            let db = ctx[postgresql.kDb];

            if (!db)
            {
                db = Self.Database.get (ctx);

                ctx.workflow.once ("complete", db.disconnect.bind (db));
            }

            return ctx[postgresql.kDb] = db;
        })
    ;
};
