-- Script de criação do banco (executado automaticamente pelo docker compose)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuarios (
  usuarioid SERIAL PRIMARY KEY,
  username  VARCHAR(50)  NOT NULL UNIQUE,
  password  VARCHAR(100) NOT NULL,
  removido  BOOLEAN      NOT NULL DEFAULT false
);

-- Tabela 1 (lado "1" da relação)
CREATE TABLE IF NOT EXISTS veiculos (
  veiculoid SERIAL PRIMARY KEY,
  placa     VARCHAR(7)   NOT NULL,
  marca     VARCHAR(50)  NOT NULL,
  modelo    VARCHAR(50)  NOT NULL,
  dono      VARCHAR(100) NOT NULL,
  removido  BOOLEAN      NOT NULL DEFAULT false
);
-- A placa só precisa ser única entre os veículos não removidos
CREATE UNIQUE INDEX IF NOT EXISTS uq_veiculos_placa
  ON veiculos (placa) WHERE removido = false;

-- Tabela 2 (lado "N" da relação): cada passagem do veículo pelo estacionamento
CREATE TABLE IF NOT EXISTS registros (
  registroid  SERIAL PRIMARY KEY,
  veiculoid   INTEGER       NOT NULL REFERENCES veiculos (veiculoid),
  horaentrada TIMESTAMPTZ   NOT NULL DEFAULT now(),
  horasaida   TIMESTAMPTZ,
  valor       NUMERIC(10,2),
  removido    BOOLEAN       NOT NULL DEFAULT false,
  CONSTRAINT ck_registros_saida CHECK (horasaida IS NULL OR horasaida >= horaentrada)
);
-- Um veículo não pode ter duas entradas abertas (sem saída) ao mesmo tempo
CREATE UNIQUE INDEX IF NOT EXISTS uq_registros_aberto
  ON registros (veiculoid) WHERE horasaida IS NULL AND removido = false;

-- Usuário padrão: angelo / angelo
INSERT INTO usuarios (username, password)
VALUES ('angelo', crypt('angelo', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

-- Dados de exemplo
INSERT INTO veiculos (placa, marca, modelo, dono)
SELECT * FROM (VALUES
  ('ABC1D23', 'Fiat',      'Argo',  'Maria Souza'),
  ('QWE4R56', 'Chevrolet', 'Onix',  'João Pereira'),
  ('JKL7M89', 'Honda',     'Civic', 'Carlos Lima')
) AS v(placa, marca, modelo, dono)
WHERE NOT EXISTS (SELECT 1 FROM veiculos);
