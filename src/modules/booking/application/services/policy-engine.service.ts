import {
    IPolicyEngine,
    IPolicy
} from '../policies/policy.interfaces';
import {
    PolicyContext,
    PolicyResult,
    PolicyTrace,
    BookingCommandType,
    PolicyEvaluationRecord
} from '../policies/policy.types';

/**
 * Motor de Políticas determinístico y secuencial.
 * Orquesta la evaluación de reglas inyectadas sin conocer su lógica interna.
 * Implementa estrategia Fail-Fast (Short-Circuit con prioridad).
 */
export class PolicyEngineService implements IPolicyEngine {
    private policies: IPolicy[];

    constructor(policies: IPolicy[]) {
        // Aseguramos orden determinístico al instanciar el motor
        this.policies = [...policies].sort((a, b) => a.order - b.order);
    }

    /**
     * Evalúa reglas en orden. Detiene ejecución si encuentra DENY o REQUIRE_ACTION.
     */
    async evaluate(
        command: BookingCommandType,
        context: PolicyContext
    ): Promise<{ decision: PolicyResult; trace: PolicyTrace }> {
        const traceRecords: PolicyEvaluationRecord[] = [];
        let finalDecision: PolicyResult | null = null;

        // 1. Iteración Secuencial
        for (const policy of this.policies) {
            // Filtrar reglas irrelevantes
            if (!policy.shouldApply(command, context)) {
                continue;
            }

            // Evaluar
            const result = await policy.evaluate(context);

            // Registrar en Trace
            const record: PolicyEvaluationRecord = {
                policyId: policy.id,
                order: policy.order,
                result: result,
                evaluatedAt: new Date() // Logical timestamp of evaluation step
            };
            traceRecords.push(record);

            // 2. Short-Circuit Logic
            // Si no es ALLOW, detenemos y retornamos esa decisión (DENY o REQUIRE_ACTION)
            if (result.status !== 'ALLOW') {
                finalDecision = result;
                break;
            }
        }

        // 3. Fallback: Si nadie se quejó, es un ALLOW global.
        if (!finalDecision) {
            finalDecision = {
                status: 'ALLOW',
                policyId: 'PolicyEngine',
                reasonCode: 'policy.engine.all_rules_passed',
                message: 'All applicable policies passed.'
            };
        }

        // Construir Traza Final
        const trace: PolicyTrace = {
            command,
            overallStatus: finalDecision.status,
            records: traceRecords,
            timestamp: new Date()
        };

        return { decision: finalDecision, trace };
    }
}
