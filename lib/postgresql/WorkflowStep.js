module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.WorkflowStep", "nit.WorkflowStep"))
        .categorize ("postgresql.workflowsteps")
        .use ("postgresql.Database")
        .do ("Context", Context =>
        {
            Context
                .getter ("db", function ()
                {
                    let self = this;
                    let db = self.lookupService ("postgresql.Database", true);

                    if (!db)
                    {
                        self.registerService (db = new Self.Database);

                        self.workflow.once ("complete", db.disconnect.bind (db));
                    }

                    return db;
                })
            ;
        })
    ;
};
