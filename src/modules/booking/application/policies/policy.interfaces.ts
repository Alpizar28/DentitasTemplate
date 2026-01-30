import { PolicyContext, PolicyResult, BookingCommandType, PolicyTrace } from './policy.types';

/**
 * Interface para una Regla de Negocio individual.
 * Debe ser stateless y side-effect free.
 */
export interface IPolicy {
    /**
     * Identificador único y estable de la política.
     * Usado para trazabilidad y configuración.
     * Ej: "LeadTimePolicy", "CancellationWindowPolicy"
     */
    readonly id: string;

    /**
     * Orden de prioridad de ejecución (menor = antes).
     * 0-100: Blockers / Security
     * 100-500: Business Logic Core
     * 500+: Soft Constraints
     */
    readonly order: number;

    /**
     * Define si esta política debe ejecutarse para el comando dado.
     * Permite filtrar reglas irrelevantes (ej. CancellationPolicy no corre en CreateHold).
     */
    shouldApply(command: BookingCommandType, context: PolicyContext): boolean;

    /**
     * Ejecuta la lógica de la regla.
     * Retorna una Promesa para permitir reglas que requieran datos externos (cargados via puertos, no DB directa).
     */
    evaluate(context: PolicyContext): Promise<PolicyResult>;
}

/**
 * Interface del Motor de Orquestación.
 * Responsable de cargar las reglas, iterarlas y agregar resultados.
 */
export interface IPolicyEngine {
    /**
     * Evalúa todas las reglas aplicables para un comando y contexto dado.
     * Implementa la estrategia Fail-Fast (detenerse al primer DENY) o Collect-All según diseño.
     * 
     * @returns Objeto compuesto con la decisión final y la traza de auditoría.
     */
    evaluate(
        command: BookingCommandType,
        context: PolicyContext
    ): Promise<{ decision: PolicyResult; trace: PolicyTrace }>;
}
