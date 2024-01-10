module.exports = function (nit, postgresql)
{
    return postgresql.defineWorkflowStep ("Transaction")
        .field ("<steps...>", "nit.WorkflowStep", "The steps to run.")
        .onRun (function (ctx)
        {
            return nit.Queue ()
                .push (function ()
                {
                    return ctx.db.begin ();
                })
                .push (this.steps.map (function (step)
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
                        await ctx.db.rollback ();
                    }
                    else
                    {
                        await ctx.db.commit ();
                    }
                })
                .run ()
            ;
        })
    ;
};
