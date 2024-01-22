module.exports = function (nit, postgresql)
{
    return postgresql.defineCommand ("QueueServer")
        .describe ("Start the queue server.")
        .commandplugin ("http:server",
        {
            name: "nit queue server",
            config:
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
};
