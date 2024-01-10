module.exports = function (nit)
{
    return nit.defineClass ("postgresql.serverplugins.QueueServer", "http.ServerPlugin")
        .field ("[jobModel]", "string?", "The job model name.")
        .field ("channel", "string?", "The channel to listen to.")
        .field ("db", "postgresql.Database?", "The database connection.")
        .field ("concurrency", "integer?", "The max number of running jobs.")
        .field ("maxRetries", "integer?", "The max number of retries for a failed job.")
        .field ("retryDelay", "integer?", "The base delay time in ms for job retry. The total delay time will be retries * retryDelay.")
        .property ("queueServer", "postgresql.QueueServer")
        .onPreInit (function (server)
        {
            let opts = this.toPojo (true);

            opts.db = opts.db || server.lookupServiceProvider ("postgresql.Database")?.create ();

            this.queueServer = nit.new ("postgresql.QueueServer", opts);

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
