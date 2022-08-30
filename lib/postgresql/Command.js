module.exports = function (nit)
{
    return nit.defineClass ("postgresql.Command", "nit.Command")
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
            Context
                .field ("db", "postgresql.Database", "The database.")
                .postConstruct (async function (ctx)
                {
                    ctx.db = nit.new ("postgresql.Database", ctx.input.toPojo ());

                    await ctx.db.connect ();
                })
            ;
        })
        .method ("finally", async function (ctx)
        {
            await ctx.db.disconnect ();
        })
    ;
};
