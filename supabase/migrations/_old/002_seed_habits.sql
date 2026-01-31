-- ============================================================================
-- SEED DATA: Habit Definitions and Negative Habit Definitions
-- ============================================================================

-- Insert Habit Definitions
INSERT INTO habit_definitions (id, name, icon, time_of_day, goal_duration, base_time) VALUES
  -- Morning habits (6:00-11:59)
  (1, 'Tomar Agua (mañana)', '💧', 'morning', '5 min', '05:50'),
  (2, 'Ejercicio', '🎾', 'morning', '40 min', '07:00'),
  (3, 'Ducha fria', '🚿', 'morning', '10 min', '08:15'),
  (4, 'Desayuno', '🍳', 'morning', '30 min', '08:30'),
  (5, 'Lavarme los dientes', '🪥', 'morning', '2 min', '09:00'),
  (6, 'Seda Dental', '🦷', 'morning', '2 min', '09:05'),
  (7, 'Tender la cama', '🛏️', 'morning', '3 min', '09:10'),
  (20, 'Lavar loza del desayuno', '🧽', 'morning', '10 min', '09:15'),
  (22, 'Aplicarme bloqueador solar', '☀️', 'morning', '5 min', '09:30'),

  -- Afternoon habits (12:00-17:59)
  (8, 'Almuerzo', '🍽️', 'afternoon', '60 min', '12:30'),
  (9, 'Siesta', '🛌', 'afternoon', '15 min', '13:00'),
  (10, 'Lavarme los dientes', '🪥', 'afternoon', '2 min', '13:15'),
  (11, 'Seda Dental', '🦷', 'afternoon', '2 min', '13:30'),
  (19, 'Tomar agua (tarde)', '💧', 'afternoon', '5 min', '15:00'),

  -- Night habits (18:00-22:00)
  (12, 'Cena', '🍽️', 'night', '30 min', '19:45'),
  (13, 'Lavarme los dientes', '🪥', 'night', '2 min', '20:00'),
  (14, 'Seda Dental', '🦷', 'night', '2 min', '20:15'),
  (15, 'Llevar el diario', '📓', 'night', '10 min', '20:30'),
  (16, 'Botar algo que no sirva', '🗑️', 'night', '10 min', '20:45'),
  (17, 'Organizar la cocina', '🍴', 'night', '15 min', '21:00'),
  (18, 'Lectura', '📚', 'night', '5 min', '21:15'),
  (21, 'Lista de pendientes', '📝', 'night', '15 min', '21:30'),
  (23, 'Alistar la ropa para mañana', '👕', 'night', '5 min', '21:45')
ON CONFLICT (id) DO NOTHING;

-- Insert Negative Habit Definitions
INSERT INTO negative_habit_definitions (id, name, icon, category, description) VALUES
  -- Health
  (1, 'Saltarse comidas', '🍽️', 'health', NULL),
  (2, 'Dormir poco', '😴', 'health', NULL),
  (3, 'No hacer ejercicio', '🏃', 'health', NULL),
  (4, 'Comer en exceso', '🫃🏻', 'health', NULL),
  (25, 'Comida chatarra', '🍔', 'health', NULL),
  (26, 'Exceso de azúcar', '🍭', 'health', NULL),
  (27, 'Masturbación', '🍆', 'health', NULL),

  -- Productivity
  (5, 'Procrastinar', '⏰', 'productivity', NULL),
  (6, 'Distracciones', '🎯', 'productivity', NULL),
  (7, 'Multitarea', '🔄', 'productivity', NULL),
  (8, 'Desorganización', '📋', 'productivity', NULL),
  (24, 'Exceso de trabajo (Workaholic)', '🍽️', 'productivity', NULL),

  -- Social
  (9, 'Aislamiento', '🚶', 'social', NULL),
  (10, 'Conflictos', '💢', 'social', NULL),
  (11, 'No escuchar', '👂', 'social', NULL),
  (29, 'Dejar en visto', '👀', 'social', NULL),

  -- Emotional
  (15, 'Sobrepensar cosas', '😰', 'emotional', NULL),
  (16, 'Negatividad / Pesimismo', '🌧️', 'emotional', NULL),
  (17, 'Ser grosero/estresarme', '🤬', 'emotional', NULL),
  (28, 'Celos compulsivos', '💁🏻‍♂️', 'emotional', NULL),

  -- Finance
  (12, 'Gastos impulsivos', '💳', 'finance', NULL),
  (13, 'No ahorrar', '💰', 'finance', NULL),
  (14, 'Más Deudas', '📉', 'finance', NULL),

  -- Digital
  (18, 'Exceso de Redes sociales', '📱', 'digital', NULL),
  (19, 'Exceso de Videojuegos', '🎮', 'digital', NULL),
  (20, 'Exceso de Netflix', '🎬', 'digital', NULL),

  -- Environment
  (21, 'Desperdiciar agua', '💧', 'environment', NULL),
  (22, 'No reciclar', '♻️', 'environment', NULL),
  (23, 'Consumo excesivo', '🛍️', 'environment', NULL)
ON CONFLICT (id) DO NOTHING;

-- Reset sequences to continue from max ID
SELECT setval('habit_definitions_id_seq', (SELECT MAX(id) FROM habit_definitions));
SELECT setval('negative_habit_definitions_id_seq', (SELECT MAX(id) FROM negative_habit_definitions));
