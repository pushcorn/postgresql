test.api ("postgresql:list-jobs")
    .useMockPgClient ()
        .before (s => s.context.serviceproviders.push (s.dbProvider))
        .before (s => s.context.serviceproviders.push (nit.ServiceProvider.createProviderForClass ("postgresql.QueueServer")))
        .snapshot ()

    .should ("return a list of jobs")
        .mock ("db.client", "query", function (statement)
        {
            let { target, targetMethod } = this;

            if (statement == nit.trim.text`
                SELECT *
                FROM "postgresql_jobs"
                ORDER BY "rtime" DESC
                LIMIT 100
                OFFSET 0`)
            {
                target.result =
                {
                    rows:
                    [
                        { id: "1234", command: "shell echo test" },
                        { id: "5768", command: "shell echo test2" }
                    ]
                };
            }
            else
            {
                target.result = null;
            }

            return nit.invoke ([target, targetMethod], arguments);
        })
        .expectingPropertyToBeOfType ("result.response", "postgresql.responses.JobsReturned")
        .expectingPropertyToBe ("result.response.jobs.length", 2)
        .commit ()

    .should ("return a list of jobs that match the specified status")
        .init (s => s.endpoint = "GET /postgresql/queue/jobs?status=queued&limit=10")
        .mock ("db.client", "query", function (statement)
        {
            let { target, targetMethod } = this;

            if (statement == nit.trim.text`
                SELECT *
                FROM "postgresql_jobs"
                WHERE "status" = 'queued'
                ORDER BY "rtime" DESC
                LIMIT 10
                OFFSET 0`)
            {
                target.result =
                {
                    rows:
                    [
                        { id: "1234", command: "shell echo test" },
                        { id: "5768", command: "shell echo test2" }
                    ]
                };
            }
            else
            {
                target.result = null;
            }

            return nit.invoke ([target, targetMethod], arguments);
        })
        .expectingPropertyToBeOfType ("result.response", "postgresql.responses.JobsReturned")
        .expectingPropertyToBe ("result.response.jobs.length", 2)
        .commit ()
;
