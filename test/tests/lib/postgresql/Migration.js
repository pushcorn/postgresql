nit.require ("postgresql.mocks.PgClient");


test.object ("postgresql.Migration", { recreate: false })
    .should ("represent a migration task")
    .expectingMethodToReturnValue ("class.up")
    .expectingMethodToReturnValue ("class.down")
    .expectingPropertyToBeOfType ("class.table", "postgresql.Table")
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
