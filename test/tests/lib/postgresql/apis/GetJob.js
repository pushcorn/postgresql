test.api ("postgresql:get-job", "GET /postgresql/queue/jobs/1234")
    .useMockPgClient ()
        .snapshot ()

    .should ("return JobNotFound if the ID is invalid")
        .expectingPropertyToBeOfType ("result.response", "postgresql.responses.JobNotFound")
        .commit ()

    .should ("return job data if the ID is valid")
        .mock ("db.client", "query", function (statement)
        {
            let { target, targetMethod } = this;

            if (statement == nit.trim.text`
                SELECT *
                FROM "postgresql_jobs"
                WHERE "id" = '1234'
                LIMIT 1`)
            {
                target.result = { rows: [{ id: "1234", command: "shell echo test" }] };
            }
            else
            {
                target.result = null;
            }

            return nit.invoke ([target, targetMethod], arguments);
        })
        .before (s => s.context.serviceproviders.push (s.db))
        .expectingPropertyToBeOfType ("result.response", "postgresql.responses.JobReturned")
        .expectingPropertyToBe ("result.response.job.id", "1234")
        .commit ()
;
