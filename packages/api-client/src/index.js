"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UbicacionTipo = exports.MovimientoTipo = exports.UserRole = void 0;
exports.generateIdempotencyKey = generateIdempotencyKey;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["VENDEDOR"] = "vendedor";
    UserRole["BODEGA"] = "bodega";
})(UserRole || (exports.UserRole = UserRole = {}));
var MovimientoTipo;
(function (MovimientoTipo) {
    MovimientoTipo["ENTRADA"] = "entrada";
    MovimientoTipo["SALIDA"] = "salida";
    MovimientoTipo["AJUSTE"] = "ajuste";
    MovimientoTipo["TRASLADO"] = "traslado";
    MovimientoTipo["DEVOLUCION"] = "devolucion";
})(MovimientoTipo || (exports.MovimientoTipo = MovimientoTipo = {}));
var UbicacionTipo;
(function (UbicacionTipo) {
    UbicacionTipo["BODEGA"] = "bodega";
    UbicacionTipo["TIENDA"] = "tienda";
})(UbicacionTipo || (exports.UbicacionTipo = UbicacionTipo = {}));
function generateIdempotencyKey() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
//# sourceMappingURL=index.js.map