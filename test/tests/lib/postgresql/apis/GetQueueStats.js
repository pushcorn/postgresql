test.api ("postgresql:get-queue-stats")
    .should ("return the queue stats")
        .before (s => s.queueServer = nit.new ("postgresql.QueueServer"))
        .before (s => s.context.serviceproviders.push (s.queueServer))
        .mock ("queueServer", "getStats", () => ({ running: 1, scheduled: 2 }))
        .expectingPropertyToBeOfType ("result.response", "postgresql.responses.QueueStatsReturned")
        .expectingPropertyToContain ("result.response.stats", { running: 1, scheduled: 2 })
        .commit ()
;
