test ("t", async () =>
{
    nit.require ("nit.Task");
    nit.dpv (nit.require ("postgresql.Database").logger, "timestampEnabled", true);

    let queue = nit.new ("postgresql.Queue", { concurrency: 10 });

    const AddOne = nit.defineTask ("test.tasks.AddOne")
        .field ("<value>", "integer")
        .onRun (async function (ctx)
        {
            let id = ctx.lookupService ("postgresql.Database").id;
            let entry = ctx.lookupService ("postgresql.Queue.Entry");

            nit.inspect ("## entry", entry);
            // await nit.sleep (500 * Math.random ());
            await nit.sleep (500 + Math.random () * 2000);

            let eid = "5d0abc3e-a421-4f19-b6f3-905eead91615";

            if (entry.id.value == eid)
            {
                nit.beep ("shohld fail");
                throw new Error ("failed " + nit.uuid ());
            }

            nit.log ("done");
            return id;
        })
    ;


    await queue.start ();
    await queue.enqueue (new AddOne (25));
    await nit.sleep (5000);
    await queue.stop (true);

    nit.inspect (queue.db.pool.stats);
    // await queue.waitAll ();
    // await queue.rescheduleTimer.result;
    // let taskCls = nit.Object.ClassTypeParser
    // nit.log (nit.Object.
});


// test.method ("postgresql.Queue", "start")
    // .useMockPgClient ()
    // .should ("start the queue")
        // .up (s => s.createArgs = "test")
        // .before (s => s.object.db = s.db)
        // .after (async (s) =>
        // {
            // let q2 = new s.class ("q2", s.db);
            // await q2.start ();
            // q2.on ("message", m => s.q2Msg = m);

            // s.object.on ("message", m => s.msg = m);

            // await s.object.db.query ("NOTIFY @1, &2", "test", "hello there");
            // await s.object.db.client.emit ("notification", { processId: 1234, channel: "test", payload: "hello there" });
            // await s.object.db.client.emit ("notification", { processId: 1235, channel: "", payload: "error!" });
        // })
        // .mock ("logger", "error")
        // .expectingPropertyToBe ("msg.payload", "hello there")
        // .expectingPropertyToBe ("q2Msg", undefined)
        // .expectingMethodToReturnValue ("object.db.client.statements.join", "\n--\n", nit.trim.text`
            // LISTEN "test"
            // --
            // LISTEN "q2"
            // --
            // NOTIFY "test", 'hello there'
        // `)
        // .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /channel.*required/)
        // .commit ()
// ;


// test.method ("postgresql.Queue", "stop")
    // .useMockPgClient ()
    // .should ("stop the queue")
        // .up (s => s.createArgs = "test")
        // .before (s => s.object.db = s.db)
        // .before (s => s.object.start ())
        // .expectingMethodToReturnValue ("object.db.client.statements.join", "\n--\n", nit.trim.text`
            // LISTEN "test"
            // --
            // UNLISTEN "test"
        // `)
        // .commit ()
// ;
