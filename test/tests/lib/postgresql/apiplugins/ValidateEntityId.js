test.plugin ("postgresql.apiplugins.ValidateEntityId", "dispatch")
    .useMockDatabase ()
        .useModels ("postgresql.dbmodels.Job")
        .init (s => s.pluginArgs = "postgresql.dbmodels.Job")
        .init (s => s.addPlugin = "class")
        .init (s => s.pluginMethod = "apiplugin")
        .init (s => s.hostClass = nit.defineClass ("MyApi", "postgresql.Api")
            .defineRequest (Request =>
            {
                Request
                    .parameter ("<id>", "string")
                ;
            })
        )
        .init (s => s.hostClassName = "")
        .up (s => s.args = s.ctx = s.http.Context.new ({ data: { id: "aa69a37c-811a-4537-b3da-88b7af70be1c" }}, { serviceproviders: s.db }))
        .snapshot ()

    .should ("throw if no entry for the ID was found")
        .init (s => s.db.updateSuffix (".failure"))
        .throws (404)
        .commit ()

    .should ("register the loaded the entity that matches the specified ID")
        .init (s => s.db.updateSuffix (".success"))
        .mock ("postgresql.dbmodels.Job", "get", function ()
        {
            return nit.new ("postgresql.dbmodels.Job",
            {
                id: "aa69a37c-811a-4537-b3da-88b7af70be1c",
                command: "shell echo test"
            });
        })
        .after (s => s.registered = s.ctx.lookupObject ("postgresql.dbmodels.Job"))
        .returnsInstanceOf ("MyApi.Context")
        .expectingPropertyToBe ("registered.id", "aa69a37c-811a-4537-b3da-88b7af70be1c")
        .commit ()
;
