const postgresql = nit.require ("postgresql");


test.object (postgresql)
    .should ("have a pg property that returns the pg library")
        .expectingMethodToReturnValueOfType ("object.pg.types.getTypeParser", 1114, "function")
        .expecting ("the timestamp \"2022-10-10 12:00:00\" to be casted to a date %{value}", new Date ("2022-10-10 12:00:00Z"), function (strategy)
        {
            return strategy.object.pg.types.getTypeParser (1114) ("2022-10-10 12:00:00");
        })
        .expecting ("the timestamp \"2022-10-10 12:00:00Z\" to be casted to a date %{value}", new Date ("2022-10-10 12:00:00Z"), function (strategy)
        {
            return strategy.object.pg.types.getTypeParser (1114) ("2022-10-10 12:00:00Z");
        })
        .expectingMethodToReturnValue ("object.TRANSFORMS.id", "users", '"users"')
        .expectingMethodToReturnValue ("object.TRANSFORMS.id", ['data.email', true], "JSONB_EXTRACT_PATH_TEXT (\"data\", 'email')")
        .expectingMethodToReturnValue ("object.TRANSFORMS.id", 't.email', "t.\"email\"")
        .expectingMethodToReturnValue ("object.TRANSFORMS.id", ["data->>'email'", true], `"data"->>'email'`)
        .expectingMethodToReturnValue ("object.TRANSFORMS.literal", "john", "'john'")
        .expectingMethodToReturnValue ("object.TRANSFORMS.literal", undefined, "NULL")
        .expectingMethodToReturnValue ("object.TRANSFORMS.literal", null, "NULL")
        .expectingMethodToReturnValue ("object.TRANSFORMS.literal", new Date ("2022-10-10 12:00:00Z"), "'2022-10-10T12:00:00.000Z'")
        .expectingMethodToReturnValue ("object.TRANSFORMS.literal", { a: 1 }, `'{"a":1}'`)
        .expectingMethodToReturnValue ("object.TRANSFORMS.literal", [["a", "b"]], `'{"a","b"}'`)
        .expectingMethodToReturnValue ("object.TRANSFORMS.literal", [["a'\"a", "b"]], `E'{\"a''\\\\\"a\",\"b\"}'`) // eslint-disable-line no-useless-escape
        .expectingMethodToReturnValue ("object.TRANSFORMS.eq", null, "IS")
        .expectingMethodToReturnValue ("object.TRANSFORMS.eq", undefined, "IS")
        .expectingMethodToReturnValue ("object.TRANSFORMS.eq", 1, "=")
        .expectingMethodToReturnValue ("object.TRANSFORMS.ne", 1, "<>")
        .expectingMethodToReturnValue ("object.TRANSFORMS.ne", null, "IS NOT")
        .expectingMethodToReturnValue ("object.TRANSFORMS.ne", undefined, "IS NOT")
        .expectingMethodToReturnValue ("object.PATTERN_REPLACERS.id", [null, "table"], "%{table|id}")
        .expectingMethodToReturnValue ("object.PATTERN_REPLACERS.id", [null, 2], "%{$2|id}")
        .expectingMethodToReturnValue ("object.PATTERN_REPLACERS.literal", [null, "field"], "%{field|literal}")
        .expectingMethodToReturnValue ("object.PATTERN_REPLACERS.literal", [null, 1], "%{$1|literal}")
        .commit ()

    .should ("register the intstr primitive type")
        .after (s =>
        {
            s.parser = nit.Object.findTypeParser ("intstr");
        })
        .expectingPropertyToBe ("parser.defval", "")
        .expectingMethodToReturnValue ("parser.cast", 3, 3)
        .expectingMethodToReturnValue ("parser.cast", "ab", "")
        .commit ()
;


test.method (postgresql, "normalizeValue", true)
    .should ("normalize value %{args.0|format} to %{result|format}")
    .given (3)
    .returns (3)
    .commit ()

    .given (undefined)
    .given (null)
    .returns (null)
    .commit ()

    .given (new Date)
    .returns (/^\d{4}-\d{2}-\d{2}.*Z$/)
    .commit ()

    .given ({ a: 1, b: undefined, c: null })
    .returns ({ a: 1, b: null, c: null })
    .commit ()

    .given ([1, undefined, null])
    .returns ([1, null, null])
    .commit ()
;


test.method (postgresql, "serialize", true)
    .should ("serialize %{args.0|format} to %{result|format}")
    .given (3)
    .returns ("3")
    .commit ()

    .given (undefined)
    .given (null)
    .returns ("NULL")
    .commit ()
;


test.method (postgresql, "format", true)
    .should ("format statement %{args.0|format} with param %{args.1|format} to %{result|format}")
    .given ("SELECT * FROM @table", { table: "users" })
    .returns ('SELECT * FROM "users"')
    .commit ()

    .given ("SELECT * FROM @table WHERE id = &1", 11, { table: "users" })
    .returns (`SELECT * FROM "users" WHERE id = '11'`)
    .commit ()
;


test.method (postgresql, "registerTypeMapping", true)
    .should ("register the mapping for a nit type to a database type")
    .given ("intstr", "TEXT")
    .expectingPropertyToBe ("class.TYPE_MAPPINGS.intstr", "TEXT")
    .returns (postgresql)
    .commit ()
;


test.method (postgresql, "dbTypeFor", true)
    .should ("return the database type for the given nit type")
        .given ("boolean")
        .returns ("BOOLEAN")
        .commit ()

    .reset ()
        .init (() =>
        {
            nit.require ("postgresql.ids.Serial");
        })
        .given ("postgresql.ids.Serial")
        .returns ("SERIAL")
        .commit ()

    .reset ()
        .given ("postgresql.ids.Serial", nit.new ("postgresql.TypeOptions", { reference: true }))
        .returns ("INTEGER")
        .commit ()

    .reset ()
        .given ("postgresql.ids.Invalid")
        .returns ("TEXT")
        .commit ()
;


test.method (postgresql, "formatValue", true)
    .should ("format the value %{args.0} into the string %{result}")
        .given ({ a: 1 })
        .returns ('{"a":1}')
        .commit ()

    .reset ()
        .given ()
        .returns ("<undefined>")
        .commit ()

    .reset ()
        .given (null)
        .returns ("<null>")
        .commit ()

    .reset ()
        .given ("abcd")
        .returns ('"abcd"')
        .commit ()
;


test.method (postgresql, "parseValue", true)
    .should ("parse the string %{args.0} into the value %{result}")
        .given ("3")
        .returns (3)
        .commit ()

    .reset ()
        .given ('{"a": 1}')
        .returns ({ a: 1 })
        .commit ()

    .reset ()
        .given ("[1, 2]")
        .returns ([1, 2])
        .commit ()
;
