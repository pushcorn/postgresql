module.exports = function (nit, postgresql, Self)
{
    return (Self = nit.test.defineMock ("postgresql.mocks.PgPool"))
        .do (function ()
        {
            postgresql.pg.Pool = Self;
        })
        .defineInnerClass ("Client", "postgresql.mocks.PgClient", Client =>
        {
            Client
                .field ("onRelease", "function", "On release callback.")
                .method ("release", function ()
                {
                    this.onRelease (this);
                })
            ;
        })
        .field ("totalCount", "integer")
        .field ("waitingCount", "integer")
        .field ("idleCount", "integer")
        .field ("_clients...", "postgresql.mocks.PgPool.Client")

        .method ("connect", function ()
        {
            let client = new Self.Client;
            let self = this;

            client.onRelease = function ()
            {
                nit.arrayRemove (self._clients, client);
            };

            self._clients.push (client);
            self.totalCount = self._clients.length;

            return client;
        })
        .method ("end", function ()
        {
        })
    ;
};
