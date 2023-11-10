test.method ("postgresql.triggers.TimestampUpdater", "preUpdate")
    .should ("update the timestamp field on update")
        .up (s => s.User = s.postgresql.defineModel ("User")
            .field ("dateModified", "Date")
        )
        .up (s => s.dateModifiedBefore = new Date ())
        .up (s => s.createArgs = "dateModified")
        .up (s => s.args = new s.Model.ActionContext ("update",
        {
            new: new s.User ({ dateModified: s.dateModifiedBefore })
        }))
        .before (() => nit.sleep (10))
        .after (s =>
        {
            s.timeDiff = s.args[0].new.dateModified - s.dateModifiedBefore;
        })
        .expectingExprToReturnValue ("timeDiff >= 10", true)
        .commit ()

    .should ("skip updating if the allowed action does not include update")
        .up (s => s.dateModifiedBefore = new Date ())
        .up (s => s.createArgs = ["dateModified", { actions: "insert" }])
        .up (s => s.args = new s.Model.ActionContext ("update",
        {
            new: new s.User ({ dateModified: s.dateModifiedBefore })
        }))
        .before (() => nit.sleep (10))
        .after (s =>
        {
            s.timeDiff = s.args[0].new.dateModified - s.dateModifiedBefore;
        })
        .expectingExprToReturnValue ("timeDiff == 0", true)
        .commit ()
;


test.method ("postgresql.triggers.TimestampUpdater", "preInsert")
    .should ("update the timestamp field on insert")
        .up (s => s.User = s.postgresql.defineModel ("User")
            .field ("dateModified", "Date")
        )
        .up (s => s.dateModifiedBefore = new Date ())
        .up (s => s.createArgs = ["dateModified", { actions: "insert" }])
        .up (s => s.args = new s.Model.ActionContext ("insert",
        {
            new: new s.User ({ dateModified: s.dateModifiedBefore })
        }))
        .before (() => nit.sleep (10))
        .after (s =>
        {
            s.timeDiff = s.args[0].new.dateModified - s.dateModifiedBefore;
        })
        .expectingExprToReturnValue ("timeDiff >= 10", true)
        .commit ()

    .should ("skip updating if the allowed action does not include insert")
        .up (s => s.dateModifiedBefore = new Date ())
        .up (s => s.createArgs = "dateModified")
        .up (s => s.args = new s.Model.ActionContext ("insert",
        {
            new: new s.User ({ dateModified: s.dateModifiedBefore })
        }))
        .before (() => nit.sleep (10))
        .after (s =>
        {
            s.timeDiff = s.args[0].new.dateModified - s.dateModifiedBefore;
        })
        .expectingExprToReturnValue ("timeDiff == 0", true)
        .commit ()
;
