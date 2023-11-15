module.exports = function (nit, postgresql)
{
    return nit.defineClass ("postgresql.WorkflowStep", "nit.WorkflowStep")
        .categorize ("postgresql.workflowsteps")
        .use ("postgresql.Database")
        .do ("Context", Context =>
        {
            Context
                .getter ("db", function ()
                {
                    let self = this;
                    let db = self.lookupClientService ("postgresql.Database", true);

                    if (!db)
                    {
                        db = self.registerService ("client", "postgresql.Database");

                        self.workflow.once ("complete", db.disconnect.bind (db));
                    }

                    return db;
                })
            ;
        })
    ;
};
