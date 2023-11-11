module.exports = function (nit, postgresql)
{
    return postgresql.defineWorkflowStep ("Transaction")
        .field ("<steps...>", "nit.WorkflowStep", "The steps to run.")
        .onRun (function (ctx)
        {
            let self = this;
            let db = self.getDb (ctx);

            return nit.Queue ()
                .push (function ()
                {
                    return db.begin ();
                })
                .push (self.steps.map (function (step)
                {
                    return [
                        function () { return step.run (ctx); },
                        function (c) { ctx.output = nit.coalesce (nit.get (c, "result.output"), ctx.output); }
                    ];
                }))
                .complete (async function (c)
                {
                    if ((ctx.error = c.error))
                    {
                        await db.rollback ();
                    }
                    else
                    {
                        await db.commit ();
                    }
                })
            ;
        })
    ;
};
