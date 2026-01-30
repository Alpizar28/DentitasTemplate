/**
 * Abstracción del reloj del sistema.
 * Permite inyectar fechas deterministas en tests para validar expiraciones.
 */
export interface IClock {
    now(): Date;
}
