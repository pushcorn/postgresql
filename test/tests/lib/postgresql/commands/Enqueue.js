test.command ("postgresql:enqueue")
    .useMockPgClient ()
    .mock ("db.client", "query", function (statement)
    {
        let mock = this;

        if (statement == "SELECT UUID_GENERATE_V4 ()")
        {
            return { rows: [{ uuid_generate_v4: nit.uuid (true) }] };
        }

        return nit.invoke ([mock.target, mock.targetMethod], arguments);
    })
    .before (s => s.context.db = s.db)
    .deinit (s => delete s.db)
    .snapshot ()

    .should ("enqueue a job")
        .given ("shell echo 'test'")
        .returnsInstanceOf ("postgresql.responses.JobEnqueued")
        .expectingPropertyToBe ("mocks.0.invocations.3.args.0", "NOTIFY \"postgresql_jobs\"")
        .commit ()

    .should ("set the rtime according to the specified delay")
        .given ("shell echo 'test'", { scheduleDelay: 60 })
        .init (s => s.now = Date.now ())
        .mock (Date, "now", function () { return this.strategy.now; })
        .returnsInstanceOf ("postgresql.responses.JobEnqueued")
        .expectingPropertyToBe ("mocks.0.invocations.3.args.0", "NOTIFY \"postgresql_jobs\"")
        .expectingMethodToReturnValue ("result.job.rtime.getTime", null, s => s.now + 60 * 1000)
        .commit ()

    .should ("set the rtime according to the specified run date")
        .init (s => s.now = new Date (Date.now () + 60 * 1000))
        .init (s => s.args = ["shell echo 'test'", { scheduleAt: s.now }])
        .mock (Date, "now", function () { return this.strategy.now * 1; })
        .returnsInstanceOf ("postgresql.responses.JobEnqueued")
        .expectingPropertyToBe ("result.job.rtime", s => s.now)
        .commit ()
;
