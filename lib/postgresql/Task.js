module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.Task", "nit.Task"))
        .categorize ("postgresql.tasks")
        .use ("postgresql.Database")
        .field ("database", "string", "The database name.", nit.os.userInfo ().username)
        .field ("user", "string", "The database username.")
        .field ("password", "string", "The database password.", { autoShortFlag: false })
        .field ("host", "string", "The database hostname.", "localhost")
        .field ("port", "integer", "The database port.", 5432)
        .do ("Context", Context =>
        {
            Context
                .getter ("db", function ()
                {
                    let self = this;
                    let db = self.lookupService ("postgresql.Database", true);

                    if (!db)
                    {
                        self.registerService (db = new Self.Database (nit.pick (self.task.toPojo (), Self.propertyNames)));

                        self.task.once ("postFinally", db.disconnect.bind (db));
                    }

                    return db;
                })
            ;
        })
    ;
};
