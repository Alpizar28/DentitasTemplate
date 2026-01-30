
import { BookingConfig } from './config.types';
import { IFeatureFlagProvider } from '../extensions/feature-flags.interfaces';

/**
 * Port: Repository para leer la configuración persistida (Adapter de Infraestructura).
 * Módulo 2 NO debe usar esto. Solo ConfigurationService.
 */
export interface IConfigRepository {
    /**
     * Obtiene la configuración activa para un entorno dado.
     * Retorna null si no existe configuración activa.
     */
    getActiveConfig(environment: string): Promise<BookingConfig | null>;

    /**
     * Guarda o actualiza una configuración.
     * @param key Identificador único (ej: "DEFAULT" o versiones)
     * @param config Objeto completo de configuración
     */
    upsertConfig(key: string, environment: string, config: BookingConfig): Promise<void>;
}

/**
 * Port: Service para proveer configuración a la aplicación.
 * Es consumido por Module 2 (PolicyRegistry).
 */
export interface IConfigService extends IFeatureFlagProvider {
    /**
     * Obtiene la configuración completa procesada (merged).
     */
    getConfig(): BookingConfig;

    /**
     * Obtiene parámetros para una policy específica.
     * Retorna un objeto vacío si no hay params definidos.
     */
    getPolicyParams<T = any>(policyName: string): T;

    /**
     * Recarga la configuración desde las fuentes (DB, etc).
     */
    load(): Promise<void>;
}
