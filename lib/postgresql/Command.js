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
            Context
                .field ("db", "postgresql.Database", "The database connection.",
                {
                    getter: function (db)
                    {
                        let self = this;

                        if (!db && !self[Self.kConstructing])
                        {
                            db = self.lookupService ("postgresql.Database", true);

                            if (!db)
                            {
                                db = new Self.Database (self.input.toPojo ());

                                self.registerService (db);
                                self.command.once ("postFinally", () => db.disconnect ());
                            }
                        }

                        return db;
                    }
                })
            ;
        })
    ;
};
