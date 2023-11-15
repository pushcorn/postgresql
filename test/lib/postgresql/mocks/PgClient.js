module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.test.defineMock ("postgresql.mocks.PgClient"))
        .plugin ("event-emitter", "notification")
        .do (function ()
        {
            postgresql.pg.Client = Self;
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
