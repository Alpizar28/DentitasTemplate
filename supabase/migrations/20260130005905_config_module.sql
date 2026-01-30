
-- Módulo 3: Configuration DDL
-- Table for storing dynamic application configuration (JSONB)

CREATE TABLE app_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text NOT NULL, -- e.g. 'GLOBAL', 'POLICIES', 'FEATURE_FLAGS'
    environment text NOT NULL, -- 'development', 'test', 'production'
    config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    version text, -- Semantic versioning of the config structure
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    -- Ensure only one active config per key/env pair to avoid ambiguity
    CONSTRAINT unique_active_config_per_env UNIQUE NULLS NOT DISTINCT (key, environment, is_active)
);

-- Index for fast lookup by environment
CREATE INDEX idx_app_config_lookup ON app_config (environment, key) WHERE is_active = true;
