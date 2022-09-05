const postgresql = nit.require ("postgresql");

test.object (postgresql)
    .should ("have a pg property that returns the pg library")
    .expectingMethodToReturnValueOfType ("object.pg.types.getTypeParser", "function", 1114)
    .expecting ("the timestamp \"2022-10-10 12:00:00\" to be casted to a date %{value}", new Date ("2022-10-10 12:00:00Z"), function (strategy)
    {
        return strategy.object.pg.types.getTypeParser (1114) ("2022-10-10 12:00:00");
    })
    .expectingMethodToReturnValue ("object.TRANSFORMS.id", '"users"', "users")
    .expectingMethodToReturnValue ("object.TRANSFORMS.literal", "'john'", "john")
    .expectingMethodToReturnValue ("object.TRANSFORMS.literal", "NULL", undefined)
    .expectingMethodToReturnValue ("object.TRANSFORMS.literal", "NULL", null)
    .expectingMethodToReturnValue ("object.TRANSFORMS.literal", "'2022-10-10T12:00:00.000Z'", new Date ("2022-10-10 12:00:00Z"))
    .expectingMethodToReturnValue ("object.TRANSFORMS.literal", `'{"a":1}'`, { a: 1 })
    .expectingMethodToReturnValue ("object.TRANSFORMS.eq", "IS", null)
    .expectingMethodToReturnValue ("object.TRANSFORMS.eq", "IS", undefined)
    .expectingMethodToReturnValue ("object.TRANSFORMS.eq", "=", 1)
    .expectingMethodToReturnValue ("object.PATTERN_REPLACERS.id", "%{table|id}", null, "table")
    .expectingMethodToReturnValue ("object.PATTERN_REPLACERS.id", "%{$2|id}", null, 2)
    .expectingMethodToReturnValue ("object.PATTERN_REPLACERS.literal", "%{field|literal}", null, "field")
    .expectingMethodToReturnValue ("object.PATTERN_REPLACERS.literal", "%{$1|literal}", null, 1)
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
