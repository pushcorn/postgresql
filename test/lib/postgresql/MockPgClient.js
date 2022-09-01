module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.test.defineMock ("postgresql.MockPgClient"))
        .do (function ()
        {
            postgresql.pg.Client = Self;
        })
        .field ("result", "object", "The results to return.")
        .field ("statement", "string", "The last statement.")

        .defineInnerClass ("Tasks", Tasks =>
        {
            Tasks
                .staticMethod ("createClient", function ()
                {
                    Self.reset ();
                    this.object.client = new Self;
                })
                .staticMethod ("returnResult", function (result)
                {
                    return function ()
                    {
                        this.object.client.result = result;
                    };
                })
            ;
        })

        .method ("escapeIdentifier", function (v)
        {
            return `"${v}"`;
        })
        .method ("escapeLiteral", function (v)
        {
            return `'${v}'`;
        })
        .method ("connect", function ()
        {
        })
        .method ("end", function ()
        {
        })
        .method ("query", function (statement)
        {
            this.statement = statement;

            return this.result;
        })
    ;
};
