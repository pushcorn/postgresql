module.exports = function (nit, postgresql, Self)
{
    return (Self = postgresql.defineCommand ("QueueServer"))
        .describe ("Start the queue server.")
        .use ("http.Server")
        .defineInput (Input =>
        {
            Input
                .option ("port", "integer?", "The listening port.")
                .option ("address", "string?", "The listening host name or IP.")
                .option ("name", "string?", "The server name.", "nit queue server")
                .option ("stopTimeout", "integer?", "The time (ms) to wait before the server ends all connections when it's stopped.")
                .option ("version", "string?", "The server version", () => require (nit.path.join (__dirname, "../../../package.json")).version)
                .option ("config", "config", "The config key or object to use.",
                {
                    defval:
                    {
                        "serverplugins":
                        [
                            "http:auto-restart",
                            "postgresql:queue-server"
                        ]
                        ,
                        "services":
                        [
                        {
                            "@name": "http:api-server",
                            "includes": ["http.*", "postgresql.*"]
                        }
                        ]
                    }
                })
            ;
        })
        .property ("server", "http.Server")
        .onRun (async function ({ input })
        {
            let { config } = input;
            let options = nit.omit (input.toPojo (), "config");

            nit.assign (options, config);

            let server = this.server = new Self.Server (options);

            await server.start ();
        })
    ;
};
