module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.WorkflowStep", "nit.WorkflowStep"))
        .categorize ("postgresql.workflowsteps")
        .use ("postgresql.Database")
        .do ("Context", Context =>
        {
            Context
                .serviceprovider ("postgresql:database")
                .getter ("db", false, false, function () { return this.lookupService ("postgresql.Database"); })
            ;
        })
    ;
};
