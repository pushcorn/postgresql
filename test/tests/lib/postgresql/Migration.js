nit.require ("postgresql.mocks.PgClient");


test.object ("postgresql.Migration")
    .should ("represent a migration task")
    .given (nit.new ("postgresql.Database"))
    .expectingMethodToReturnValue ("result.up", undefined)
    .expectingMethodToReturnValue ("result.down", undefined)
    .expectingPropertyToBeOfType ("result.constructor.table", "postgresql.Table")
    .commit ()


;test.method ("postgresql.Migration", "onUp", true)
    .should ("set the up method")
    .given (nit.noop)
    .expecting ("the up hook is nit.noop", () => nit.noop, s => s.class["postgresql.Migration.up"])
    .commit ()
;


test.method ("postgresql.Migration", "onDown", true)
    .should ("set the down method")
    .given (nit.noop)
    .expecting ("the down hook is nit.noop", () => nit.noop, s => s.class["postgresql.Migration.down"])
    .commit ()
;
