module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("postgresql.Command", "nit.Command"))
        .use ("postgresql.Database")
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
            Context.getter ("db", function () { return this.lookupService ("postgresql.Database"); });
        })
        .configureComponentMethod ("run", function (Method)
        {
            Method
                .after ("initArgs", "postgresql.registerServieProvider", function (cmd, ctx)
                {
                    ctx.constructor.serviceprovider.call (ctx, "postgresql:database", ctx.input.toPojo ());
                })
            ;
        })
    ;
};
