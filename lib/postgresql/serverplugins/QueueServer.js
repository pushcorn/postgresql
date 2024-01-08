module.exports = function (nit)
{
    return nit.defineClass ("postgresql.serverplugins.QueueServer", "http.ServerPlugin")
        .field ("[jobModel]", "string?", "The job model name.")
        .field ("channel", "string?", "The channel to listen to.")
        .field ("db", "postgresql.Database?", "The database connection.")
        .field ("concurrency", "integer?", "The max number of running jobs.")
        .field ("maxRetries", "integer?", "The max number of retries for a failed job.")
        .field ("retryDelay", "integer?", "The base delay time in ms for job retry. The total delay time will be retries * retryDelay.")
        .memo ("queueServer", function ()
        {
            return nit.new ("postgresql.QueueServer", this.toPojo ());
        })
        .onPreInit (function (server)
        {
            server.serviceproviders.push (this.queueServer);
        })
        .onPreStart (function ()
        {
            return this.queueServer.start ();
        })
        .onPreStop (function ()
        {
            return this.queueServer.stop (true);
        })
    ;
};
