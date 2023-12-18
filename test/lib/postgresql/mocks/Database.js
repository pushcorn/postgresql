module.exports = function (nit, postgresql, Self)
{
    const writer = new nit.Object.Property.Writer;
    const stack = nit.stack;


    return (Self = nit.defineClass ("postgresql.mocks.Database", "postgresql.Database"))
        .m ("error.query_not_expected", "The following query was not expected:\n\n%{statement|nit.indent}")
        .use ("nit.utils.Crypto")
        .mixin (nit.test.Mock)
        .staticProperty ("record", "boolean?")
        .staticMemo ("sourceFile", () =>
        {
            let path = stack
                .split ("\n")
                .find (l => l.includes ("/test/tests/"))
                .match (nit.test.Strategy.STACK_LINE_PATTERN)[2]
            ;

            return nit.new ("nit.File", path);
        })

        .defineInnerClass ("Rewrite", Rewrite =>
        {
            Rewrite
                .field ("<from>", "string|RegExp", "The statement to be rewrited.")
                .field ("<to>", "any", "The rewrited statement.")
                .method ("applicableTo", function (statement)
                {
                    let { from } = this;

                    return !!(nit.is.str (from) ? statement == from : statement.match (from));
                })
                .method ("perform", function (statement)
                {
                    let { to } = this;

                    if (nit.is.array (to))
                    {
                        return to.length ? to.shift () : undefined;
                    }
                    else
                    if (nit.is.func (to))
                    {
                        return to (statement);
                    }
                    else
                    {
                        return to;
                    }
                })
            ;
        })
        .defineInnerClass ("Result", Result =>
        {
            Result
                .defineInnerClass ("Field", Field =>
                {
                    Field
                        .field ("name", "string")
                        .field ("dataTypeID", "integer")
                        .field ("format", "string")
                    ;
                })
                .field ("command", "string")
                .field ("rows...", "object")
                .field ("rowCount", "integer")
                .field ("fields...", Result.Field.name)

                .staticMethod ("command", function (command)
                {
                    return new Result ({ command });
                })
                .staticMethod ("row", function (row)
                {
                    return new Result ({ rows: [row] });
                })
            ;
        })
        .defineInnerClass ("Error", Error =>
        {
            Error
                .field ("code", "string")
                .field ("message", "string")
            ;
        })
        .defineInnerClass ("Expect", Expect =>
        {
            Expect
                .field ("<statement>", "string",
                {
                    setter: function (v)
                    {
                        return nit.trim.text (v);
                    }
                })
                .field ("[result]", Self.Result.name)
                .field ("error", Self.Error.name)
            ;
        })

        .defineInnerClass ("DataFile", DataFile =>
        {
            DataFile
                .field ("<source>", "nit.File", "The source file.")
                .field ("[expects...]", Self.Expect.name)

                .method ("save", async function ()
                {
                    let self = this;
                    let newData = nit.toJson (nit.omit (self.toPojo (), "source"), true);
                    let oldData = (await self.source.readAsync (true)) || "";

                    if (Self.Crypto.sha1 (newData) != Self.Crypto.sha1 (oldData))
                    {
                        await self.source.writeAsync (newData);

                        return true;
                    }
                    else
                    {
                        return false;
                    }
                })
                .method ("load", async function ()
                {
                    let self = this;

                    DataFile.assign (self, JSON.parse (await self.source.readAsync ()));

                    for (let expect of self.expects)
                    {
                        let result = expect.result;

                        if (result?.fields.length)
                        {
                            let fields = nit.index (result.fields, "name");

                            for (let row of result.rows)
                            {
                                for (let k in row)
                                {
                                    let parser = postgresql.pg.types.getTypeParser (fields[k].dataTypeID);

                                    if (!nit.is.undef (row[k]) && !parser.name.endsWith ("Array"))
                                    {
                                        row[k] = postgresql.pg.types.getTypeParser (fields[k].dataTypeID) (row[k]);
                                    }
                                }
                            }
                        }
                    }
                })
            ;
        })

        .field ("record", "boolean", "Enable the record mode if true.")
        .field ("dataFile", "nit.File", "The query data file.")
        .field ("suffix", "string", "The additional file suffix.")
        .property ("expects...", Self.Expect.name)
        .property ("rewrites...", Self.Rewrite.name)
        .property ("connected", "boolean", { writer })

        .onPostConstruct (function ()
        {
            let self = this;

            self.record = self.record || Self.record;

            if (!self.dataFile)
            {
                self.dataFile = nit.path.join (Self.sourceFile.dirname, nit.path.parse (Self.sourceFile.basename).name + self.suffix + ".data.json");
            }
        })

        .method ("expect", function ()
        {
            this.expects.push (new Self.Expect (...arguments));

            return this;
        })
        .method ("rewrite", function ()
        {
            let r = new Self.Rewrite (...arguments);

            nit.arrayRemove (this.rewrites, r.from);

            this.rewrites.push (r);

            return this;
        })
        .method ("connect", async function ()
        {
            let self = this;

            if (self.record)
            {
                await Self.superclass.prototype.connect.call (self);
            }
            else
            if (!self.connected)
            {
                self.connected = writer.value (true);

                if (self.dataFile.exists ())
                {
                    let dataFile = new Self.DataFile (self.dataFile);

                    await dataFile.load ();

                    self.expects = dataFile.expects;
                }
            }

            return self;
        })
        .method ("save", async function ()
        {
            let self = this;

            if (self.transacting && self.client)
            {
                await nit.invoke.silent ([this, "rollback"]);
            }

            if (self.record && !global.test.unexpectedErrors.length)
            {
                await Self.DataFile (self.dataFile, ...self.expects).save ();
            }

            return self;
        })
        .method ("execute", async function (statement)
        {
            if (statement instanceof Self.Query)
            {
                statement = statement.sql;
            }

            let self = this;
            let expect = new Self.Expect ({ statement });

            if (self.record)
            {
                try
                {
                    statement = self.rewrites.find (r => r.applicableTo (statement))?.perform (statement) || statement;

                    let result = nit.clone.shallow (await Self.superclass.prototype.execute.call (self, statement));

                    result.fields = result.fields.map (nit.clone.shallow);
                    expect.result = result;
                    self.expects.push (expect);
                }
                catch (e)
                {
                    expect.error = Self.Error (nit.clone.shallow (e, true));
                    self.expects.push (expect);

                    throw e;
                }
            }
            else
            {
                await self.connect ();

                expect = self.expects.shift ();

                if (expect?.statement != statement)
                {
                    self.throw ("error.query_not_expected", { statement });
                }

                self.debug ("debug.statement", { statement });

                if (expect.error)
                {
                    self.throw (expect.error);
                }

                if (expect.result.command == "BEGIN")
                {
                    self.transacting = true;
                }
                else
                if (self.transacting
                    && (expect.result.command == "COMMIT" || expect.result.command == "ROLLBACK"))
                {
                    self.transacting = false;
                }
            }

            return expect.result.toPojo ();
        })
    ;
};
