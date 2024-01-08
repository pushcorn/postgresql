module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.defineClass ("postgresql.Task", "nit.Task"))
        .categorize ("postgresql.tasks")
        .use ("postgresql.Database")
        .field ("database", "string?", "The database name.")
        .field ("user", "string?", "The database username.")
        .field ("password", "string?", "The database password.")
        .field ("host", "string?", "The database hostname.")
        .field ("port", "integer?", "The database port.")
        .do ("Context", Context =>
        {
            Context
                .getter ("db", false, false, function () { return this.lookupService ("postgresql.Database"); })
                .onLookupServiceProvider (function (type)
                {
                    if (type == Self.Database)
                    {
                        return nit.new ("postgresql.serviceproviders.Database", this.task.toPojo ());
                    }
                })
            ;
        })
    ;
};
