-- =====================================================================
-- S.P.E. · Esquema de base de datos (MySQL / MariaDB, compatible con XAMPP)
-- Para PostgreSQL: cambia AUTO_INCREMENT por GENERATED ... AS IDENTITY
-- y DATETIME por TIMESTAMP.
-- =====================================================================
CREATE DATABASE IF NOT EXISTS spe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE spe;

-- Alumnos y profesores (equivale a SPE.alumnos())
CREATE TABLE alumnos (
  dni          VARCHAR(8)   NOT NULL PRIMARY KEY,
  nombre       VARCHAR(40)  NOT NULL,
  apellido     VARCHAR(40)  NOT NULL,
  email        VARCHAR(60)  NOT NULL UNIQUE,
  telefono     VARCHAR(15)  NOT NULL,
  anio         ENUM('1°','2°','3°','4°','5°','6°','Profesor') NOT NULL,
  division     ENUM('1° Div','2° Div','—') NOT NULL DEFAULT '1° Div',
  estado       ENUM('Activo','Inactivo','Suspendido') NOT NULL DEFAULT 'Activo',
  foto         VARCHAR(255) NULL,          -- ruta del archivo (no guardes la imagen en base64)
  descripcion  VARCHAR(200) NOT NULL DEFAULT '',
  creado_en    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Computadoras (equivale a SPE.pcs())
CREATE TABLE computadoras (
  id              VARCHAR(40)  NOT NULL PRIMARY KEY,   -- Ej: HP-01 (no cambia al editar el nombre)
  nombre          VARCHAR(30)  NOT NULL UNIQUE,
  marca           VARCHAR(30)  NOT NULL,
  modelo          VARCHAR(40)  NOT NULL,
  ram             VARCHAR(10)  NOT NULL DEFAULT '—',
  almacenamiento  VARCHAR(20)  NOT NULL DEFAULT '—',
  estado          ENUM('Disponible','Prestada','En reparación') NOT NULL DEFAULT 'Disponible'
);

-- Préstamos (equivale a SPE.prestamos()). devuelto = NULL mientras esté en uso.
CREATE TABLE prestamos (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  pc_id     VARCHAR(40) NOT NULL,
  dni       VARCHAR(8)  NOT NULL,
  fecha     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  devuelto  DATETIME    NULL,
  FOREIGN KEY (pc_id) REFERENCES computadoras(id) ON UPDATE CASCADE,
  FOREIGN KEY (dni)   REFERENCES alumnos(dni)     ON UPDATE CASCADE,   -- si editas el DNI, el préstamo lo sigue
  INDEX (dni, devuelto),
  INDEX (pc_id, devuelto)
);

-- Actividad reciente del panel (equivale a SPE.log())
CREATE TABLE actividad (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  fecha  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  mensaje VARCHAR(255) NOT NULL
);

-- Administradores (hoy está escrito en js/index.js: pásalo acá)
-- La contraseña NUNCA en texto plano: guarda el hash (bcrypt / password_hash de PHP)
CREATE TABLE administradores (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(40)  NOT NULL,
  apellido      VARCHAR(40)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  UNIQUE (nombre, apellido)
);

-- Datos de ejemplo (los mismos que trae la página)
INSERT INTO alumnos (dni,nombre,apellido,email,telefono,anio,division,estado) VALUES
 ('49096596','Yago','Calle','yago@ejemplo.com','3825671774','6°','1° Div','Activo'),
 ('45123456','Lucía','Fernández','lucia@ejemplo.com','3825400111','5°','2° Div','Activo'),
 ('46234567','Mateo','Ramírez','mateo@ejemplo.com','3825400222','4°','1° Div','Activo');

INSERT INTO computadoras (id,nombre,marca,modelo,ram,almacenamiento,estado) VALUES
 ('HP-01','Hp 01','HP','ProBook 450 G8','8 GB','256 GB SSD','Disponible'),
 ('LEN-06','Lenovo 06','Lenovo','ThinkPad E14','8 GB','512 GB SSD','Disponible'),
 ('JM-18','Juana Manso 18','Juana Manso','Netbook JM-2021','4 GB','128 GB SSD','Disponible'),
 ('CI-08','Conectar Igualdad 08','Conectar Igualdad','Positivo BGH','4 GB','320 GB HDD','Prestada'),
 ('HP-02','Hp 02','HP','250 G7','4 GB','500 GB HDD','En reparación');

INSERT INTO prestamos (pc_id,dni) VALUES ('CI-08','46234567');
