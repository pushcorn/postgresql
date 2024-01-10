module.exports = function (nit)
{
    return nit.defineClass ("postgresql.WorkflowStep", "nit.WorkflowStep")
        .categorize ("postgresql.workflowsteps")
        .do ("Context", Context =>
        {
            Context
                .serviceprovider ("postgresql:database")
                .getter ("db", false, false, function () { return this.lookupService ("postgresql.Database"); })
            ;
        })
    ;
};
