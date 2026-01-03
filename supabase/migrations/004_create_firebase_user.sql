-- ============================================================================
-- Crear profile para el usuario de Firebase
-- ============================================================================

-- Insertar profile con el ID de Firebase
INSERT INTO profiles (id, email, created_at, updated_at)
VALUES ('HPiS7rrqvKVm9uZBV8sHzW8wQz33', 'alexander@novapixel.org', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
