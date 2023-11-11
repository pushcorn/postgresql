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
        .method ("getDb", function (ctx)
        {
            let self = this;
            let db = ctx[postgresql.kDb];

            if (!db)
            {
                db = Self.Database.get (ctx, nit.pick (self.toPojo (), Self.propertyNames));

                this.once ("postFinally", () => db.disconnect ());
            }

            return ctx[postgresql.kDb] = db;
        })
    ;
};
