test.object ("postgresql.Migration")
    .should ("represent a migration task")
    .expectingMethodToReturnValue ("result.up", undefined)
    .expectingMethodToReturnValue ("result.down", undefined)
    .expectingPropertyToBeOfType ("result.constructor.table", "postgresql.Table")
    .commit ()

;test.method ("postgresql.Migration", "up", true)
    .should ("set the up method")
    .given (nit.noop)
    .expectingPropertyToBe ("class.prototype.up", nit.noop)
    .commit ()
;


test.method ("postgresql.Migration", "down", true)
    .should ("set the down method")
    .given (nit.noop)
    .expectingPropertyToBe ("class.prototype.down", nit.noop)
    .commit ()
;
