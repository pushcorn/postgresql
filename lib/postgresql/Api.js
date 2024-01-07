module.exports = function (nit)
{
    return nit.defineClass ("postgresql.Api", "http.Api")
        .categorize ("postgresql.apis")
        .defineComponentPlugin ()
        .defineContext (Context =>
        {
            Context
                .serviceprovider ("postgresql:database")
                .getter ("db", false, false, function () { return this.lookupService ("postgresql.Database"); })
            ;
        })
    ;
};
