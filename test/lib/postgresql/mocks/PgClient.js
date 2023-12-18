module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.test.defineMock ("postgresql.mocks.PgClient"))
        .plugin ("event-emitter", "notification")
        .constant ("PG_CLIENT", postgresql.pg.Client)
        .staticMethod ("init", function ()
        {
            Self.reset ();
            postgresql.pg.Client = Self;

            return Self;
        })
        .staticMethod ("deinit", function ()
        {
            postgresql.pg.Client = Self.PG_CLIENT;

            return Self;
        })
        .field ("result", "object?", "The results to return.")
        .field ("statement", "string", "The last statement.")
        .property ("statements...", "string")

        .method ("connect", function ()
        {
        })
        .method ("end", function ()
        {
        })
        .method ("query", function (statement)
        {
            this.statement = nit.trim (statement);
            this.statements.push (this.statement);

            return this.result || {
                command: statement.split (/\s/)[0],
                rows: [],
                rowCount: 0,
                fields: []
            };
        })
    ;
};
