module.exports = function (nit)
{
    return nit.defineClass ("postgresql.Command", "nit.Command")
        .categorize ()
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
                .construct (async function ()
                {
                    if (!this.db)
                    {
                        this.db = nit.new ("postgresql.Database", this.input.toPojo ());

                        await this.db.connect ();
                    }
                })
            ;
        })
        .method ("finally", async function (ctx)
        {
            await ctx.db.disconnect ();
        })
    ;
};
