module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("postgresql.Command", "nit.Command"))
        .k ("registerDatabaseProvider")
        .categorize ("postgresql.commands")
        .defineInput (Input =>
        {
            Input
                .option ("database", "string", "The database name.", nit.os.userInfo ().username)
                .option ("user", "string", "The database username.")
                .option ("password", "string", "The database password.", { autoShortFlag: false })
                .option ("host", "string", "The database hostname.", "localhost")
                .option ("port", "integer", "The database port.", 5432)
            ;
        })
        .defineContext (Context =>
        {
            Context.getter ("db", false, false, function () { return this.lookupService ("postgresql.Database"); });
        })
        .configureComponentMethod ("run", function (Method)
        {
            Method.after (Self.kInitContext, Self.kRegisterDatabaseProvider, function (cmd, ctx)
            {
                if (!ctx.lookupService ("postgresql.Database", true))
                {
                    ctx.serviceproviders.push (nit.new ("postgresql.serviceproviders.Database", ctx.input.toPojo ()));
                }
            });
        })
    ;
};
