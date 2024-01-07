test.api ("postgresql:remove-job", "DELETE /postgresql/queue/jobs/1234")
    .useMockPgClient ()
        .snapshot ()

    .should ("return JobNotFound if the ID is invalid")
        .expectingPropertyToBeOfType ("result.response", "postgresql.responses.JobNotFound")
        .commit ()

    .should ("remove a valid job from the queue")
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
        .before (s => s.context.serviceproviders.push (s.dbProvider))
        .before (s => s.context.serviceproviders.push (nit.ServiceProvider.createProviderForClass ("postgresql.QueueServer")))
        .expectingPropertyToBeOfType ("result.response", "postgresql.responses.JobRemoved")
        .expectingPropertyToBe ("db.client.statements.2", nit.trim.text`
            DELETE FROM "postgresql_jobs"
            WHERE "id" = '1234'
        `)
        .commit ()
;
