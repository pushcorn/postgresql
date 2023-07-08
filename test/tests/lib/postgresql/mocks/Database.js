const Database = nit.require ("postgresql.mocks.Database");
const DATA_FILE_PATH = nit.path.format (nit.do (nit.path.parse (__filename), p => { p.base = p.name + ".data.json"; }));

beforeAll (() => Database.record = false);


test.method ("postgresql.mocks.Database.Rewrite", "perform")
    .should ("rewrite the query")
        .up (s => s.createArgs = ["SELECT UUID_GENERATE_V4 ()", "SELECT '72133cfb-c1b3-4bf9-a4cf-819f2ee24cee'"])
        .given ("SELECT UUID_GENERATE_V4 ()")
        .returns ("SELECT '72133cfb-c1b3-4bf9-a4cf-819f2ee24cee'")
        .commit ()

    .up (s => s.createArgs = ["SELECT UUID_GENERATE_V4 ()", ["SELECT '72133cfb-c1b3-4bf9-a4cf-819f2ee24cee'", "SELECT '72133cfb-c1b3-4bf9-a4cf-819f2ee24ce2'"]])
        .given ("SELECT UUID_GENERATE_V4 ()")
        .returns ("SELECT '72133cfb-c1b3-4bf9-a4cf-819f2ee24cee'")
        .expectingMethodToReturnValue ("object.perform", "SELECT UUID_GENERATE_V4 ()", "SELECT '72133cfb-c1b3-4bf9-a4cf-819f2ee24ce2'")
        .expectingMethodToReturnValue ("object.perform", "SELECT UUID_GENERATE_V4 ()", undefined)
        .commit ()

    .up (s => s.createArgs = ["SELECT UUID_GENERATE_V4 ()", (statement) => (statement.includes ("_V4") ? "SELECT '72133cfb-c1b3-4bf9-a4cf-819f2ee24cee'" : undefined)])
        .given ("SELECT UUID_GENERATE_V4 ()")
        .returns ("SELECT '72133cfb-c1b3-4bf9-a4cf-819f2ee24cee'")
        .expectingMethodToReturnValue ("object.perform", "SELECT UUID_GENERATE_V1 ()", undefined)
        .commit ()
;


test.method ("postgresql.mocks.Database.Result", "command", true)
    .should ("return a result for the specified command")
        .given ("BEGIN")
        .returnsInstanceOf ("postgresql.mocks.Database.Result")
        .expectingPropertyToBe ("result.command", "BEGIN")
        .commit ()
;


test.method ("postgresql.mocks.Database.Result", "row", true)
    .should ("return a result for the given row")
        .given ({ id: 1 })
        .returnsInstanceOf ("postgresql.mocks.Database.Result")
        .expectingPropertyToBe ("result.command", "")
        .expectingPropertyToBe ("result.rows", [{ id: 1 }])
        .commit ()
;


test.object ("postgresql.mocks.Database.Expect")
    .should ("trim the given statement")
    .given (`
        SELECT * FROM users
    `)
    .expectingPropertyToBe ("result.statement", "SELECT * FROM users")
    .commit ()
;


test.method ("postgresql.mocks.Database.DataFile", "save")
    .should ("save the contents to a file")
    .app ()
    .up (({ self, application }) =>
    {
        const { Expect, Result } = Database;

        self.createArgs =
        [
            new nit.File (application.root.join ("data.json")),
            new Expect ("BEGIN", Result.command ("BEGIN"))
        ];
    })
    .returns (true)
    .expectingMethodToReturnValue ("object.source.readAsync", null, nit.toJson (
    {
        expects:
        [
        {
            statement: "BEGIN",
            result:
            {
                command: "BEGIN",
                rows: [],
                rowCount: 0,
                fields: []
            }
        }
        ]
    }, true))
    .expectingMethodToReturnValue ("object.save", null, false)
    .commit ()
;


test.method ("postgresql.mocks.Database.DataFile", "load")
    .should ("load the saved query results from a file")
        .app ()
        .up (async ({ self, application }) =>
        {
            let source = new nit.File (application.root.join ("data.json"));

            self.createArgs = source;

            await source.writeAsync (nit.toJson (
            {
                expects:
                [
                {
                    statement: "SELECT id FROM users",
                    result:
                    {
                        command: "SELECT",
                        rows: [{ id: "3" }],
                        rowCount: 1,
                        fields:
                        [
                        {
                            "name": "id",
                            "dataTypeID": 25,
                            "format": "text"
                        }
                        ]
                    }
                }
                ]
            }, true));
        })
        .expectingPropertyToBe ("object.expects.length", 1)
        .expectingMethodToReturnValue ("object.expects.0.toPojo", null,
        {
            statement: "SELECT id FROM users",
            error: undefined,
            result:
            {
                command: "SELECT",
                rows: [{ id: "3" }],
                rowCount: 1,
                fields:
                [
                {
                    "name": "id",
                    "dataTypeID": 25,
                    "format": "text"
                }
                ]
            }
        })
        .commit ()

    .app ()
        .up (async ({ self, application }) =>
        {
            let source = new nit.File (application.root.join ("data.json"));

            self.createArgs = source;

            await source.writeAsync (nit.toJson (
            {
                expects:
                [
                {
                    statement: "SELECT id FROM users",
                    result:
                    {
                        command: "SELECT",
                        rows: [{ id: "3" }],
                        rowCount: 1
                    }
                }
                ]
            }, true));
        })
        .expectingPropertyToBe ("object.expects.length", 1)
        .expectingMethodToReturnValue ("object.expects.0.toPojo", null,
        {
            statement: "SELECT id FROM users",
            error: undefined,
            result:
            {
                command: "SELECT",
                rows: [{ id: "3" }],
                rowCount: 1,
                fields: []
            }
        })
        .commit ()
;


test.custom ("Method: postgresql.mocks.Database.postConstruct ()")
    .should ("should set up the sourceFile and dataFile properties")
        .task (() => new Database)
        .task (() => new Database ({ dataFile: DATA_FILE_PATH }))
        .expectingPropertyToBe ("result.dataFile.absPath", DATA_FILE_PATH)
        .commit ()
;


test.method ("postgresql.mocks.Database", "expect")
    .should ("add an expect object")
    .given ("BEGIN")
    .returnsInstanceOf ("postgresql.mocks.Database")
    .expectingPropertyToBe ("result.expects.length", 1)
    .commit ()
;


test.method ("postgresql.mocks.Database", "rewrite")
    .should ("add a rewrite object")
    .given ("SELECT UUID_GENERATE_V4 ()", "SELECT '72133cfb-c1b3-4bf9-a4cf-819f2ee24cee'")
    .returnsInstanceOf ("postgresql.mocks.Database")
    .expectingPropertyToBe ("result.rewrites.length", 1)
    .commit ()
;


test.method ("postgresql.mocks.Database", "connect")
    .useMockPgClient ()
    .should ("connect to the database if record mode is on")
        .app ()
        .up (s =>
        {
            s.createArgs =
            {
                record: true,
                dataFile: s.application.root.join ("data.json")
            };
        })
        .returnsInstanceOf ("postgresql.mocks.Database")
        .commit ()

    .should ("load query results from the data file if record mode is off")
        .app ()
        .up (async (s) =>
        {
            let dataFile = nit.new ("nit.File", s.application.root.join ("data.json"));

            s.createArgs =
            {
                record: false,
                dataFile
            };

            await dataFile.writeAsync (nit.toJson (
            {
                expects:
                [
                {
                    statement: "BEGIN",
                    result:
                    {
                        command: "BEGIN",
                        rows: [],
                        rowCount: 0,
                        fields: []
                    }
                }
                ]
            }, true));
        })
        .returnsInstanceOf ("postgresql.mocks.Database")
        .expectingPropertyToBe ("result.expects.length", 1)
        .expectingPropertyToBe ("result.expects.0.statement", "BEGIN")
        .expectingMethodToReturnValueOfType ("result.connect", null, "postgresql.mocks.Database")
        .commit ()

    .should ("skip loading the data file does not exist")
        .app ()
        .up (async (s) =>
        {
            let dataFile = nit.new ("nit.File", s.application.root.join ("data.json"));

            s.createArgs =
            {
                record: false,
                dataFile
            };
        })
        .returnsInstanceOf ("postgresql.mocks.Database")
        .expectingPropertyToBe ("result.expects.length", 0)
        .commit ()
;


test.method ("postgresql.mocks.Database", "disconnect")
    .useMockPgClient ()
    .should ("disconnect the database and write the recorded queries to file")
        .app ()
        .up (s =>
        {
            s.createArgs =
            {
                record: true,
                dataFile: s.application.root.join ("data.json")
            };
        })
        .before (async (s) =>
        {
            await s.object.begin ();
        })
        .after (async (s) =>
        {
            s.data = JSON.parse (await s.object.dataFile.readAsync ());
        })
        .returnsInstanceOf ("postgresql.mocks.Database")
        .expectingPropertyToBe ("data.expects.length", 2)
        .expectingPropertyToBe ("data.expects.0.statement", "BEGIN")
        .expectingPropertyToBe ("data.expects.1.statement", "ROLLBACK")
        .commit ()

    .should ("not write queries to the data file if record mode is off")
        .app ()
        .up (s => s.createArgs = { record: false })
        .returnsInstanceOf ("postgresql.mocks.Database")
        .commit ()

    .should ("not write queries to the data file if unexpected test errors occurred")
        .app ()
        .up (s => s.createArgs = { record: true })
        .before (() => test.unexpectedErrors.push (new Error ("NO!")))
        .after (() => test.unexpectedErrors = [])
        .returnsInstanceOf ("postgresql.mocks.Database")
        .commit ()
;


test.method ("postgresql.mocks.Database", "execute")
    .useMockPgClient ()
    .should ("record the executed statements if record mode is on")
        .app ()
        .up (s => s.createArgs =
        {
            record: true,
            dataFile: s.application.root.join ("data.json")
        })
        .given ("BEGIN")
        .after (async ({ self, object: db }) =>
        {
            db.rewrite ("SELECT UUID_GENERATE_V4 ()", "SELECT '72133cfb-c1b3-4bf9-a4cf-819f2ee24cee'");

            await db.query ("SELECT UUID_GENERATE_V4 ()");
            await db.disconnect ();

            self.data = JSON.parse (await db.dataFile.readAsync ());
        })
        .expectingPropertyToBe ("data.expects.length", 3)
        .expectingPropertyToBe ("data.expects.0.statement", "BEGIN")
        .expectingPropertyToBe ("data.expects.1.statement", "SELECT UUID_GENERATE_V4 ()")
        .expectingPropertyToBe ("data.expects.2.statement", "ROLLBACK")
        .commit ()

    .should ("record the query errors")
        .app ()
        .up (s => s.createArgs =
        {
            record: true,
            dataFile: s.application.root.join ("data.json")
        })
        .given ("SELECT * FROM abc")
        .before (({ postgresql }) => test.mock (
            postgresql.mocks.PgClient.prototype,
            "query",
            () => { throw new Error ("table not found"); }
        ))
        .after (async ({ self, object: db }) =>
        {
            await db.disconnect ();

            self.data = JSON.parse (await db.dataFile.readAsync ());
        })
        .throws (/table not found/)
        .expectingPropertyToBe ("data.expects.length", 1)
        .expectingPropertyToBe ("data.expects.0.error.code", "error.database_error")
        .commit ()

    .should ("throw if the statement not in the data file when record mode is off")
        .app ()
        .up (s => s.createArgs =
        {
            dataFile: s.application.root.join ("data.json")
        })
        .given ("SELECT * FROM abc")
        .throws (/query was not expected/)
        .commit ()

    .should ("return the corresponding result for the given statement when record mode is off")
        .app ()
        .up (s => s.createArgs =
        {
            dataFile: s.application.root.join ("data.json")
        })
        .before (async ({ object: db }) =>
        {
            await db.dataFile.writeAsync (nit.toJson (
            {
                expects:
                [
                {
                    statement: "SELECT id FROM users",
                    result:
                    {
                        command: "SELECT",
                        rows: [{ id: "3" }],
                        rowCount: 1
                    }
                }
                ]
            }, true));
        })
        .given ("SELECT id FROM users")
        .returns (
        {
            command: "SELECT",
            rows: [{ id: "3" }],
            rowCount: 1,
            fields: []
        })
        .commit ()

    .should ("throw the recorded error")
        .app ()
        .up (s => s.createArgs =
        {
            dataFile: s.application.root.join ("data.json")
        })
        .before (async ({ object: db }) =>
        {
            await db.dataFile.writeAsync (nit.toJson (
            {
                expects:
                [
                {
                    statement: "SELECT id FROM users",
                    error:
                    {
                        code: "error.test",
                        message: "test error"
                    }
                }
                ]
            }, true));
        })
        .given ("SELECT id FROM users")
        .throws ("error.test")
        .commit ()
;
