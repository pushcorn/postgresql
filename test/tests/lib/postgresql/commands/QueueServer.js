test.command ("postgresql:queue-server")
    .should ("start the queue server")
        .up (s => s.args = { stopTimeout: 0 })
        .up (s => s.Logger = nit.require ("plugins.Logger"))
        .mock ("Logger.Logger.prototype", "writeLog")
        .after (s => s.object.server.stop ())
        .expectingPropertyToBe ("mocks.0.invocations.length", 3)
        .commit ()
;
