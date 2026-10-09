CREATE DATABASE IF NOT EXISTS hotel_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotel_booking;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  phone         VARCHAR(30) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('guest','admin') NOT NULL DEFAULT 'guest',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS hotels (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(140) NOT NULL,
  city          VARCHAR(100) NOT NULL,
  address       VARCHAR(255) NULL,
  phone         VARCHAR(30) NULL,
  star_rating   TINYINT UNSIGNED NOT NULL DEFAULT 3,
  description   TEXT NULL,
  image_url     VARCHAR(500) NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hotels_city (city)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rooms (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hotel_id        INT UNSIGNED NULL,
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(140) NOT NULL,
  type            ENUM('standard','deluxe','suite','family') NOT NULL DEFAULT 'standard',
  description     TEXT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  capacity        TINYINT UNSIGNED NOT NULL DEFAULT 2,
  is_ac           TINYINT(1) NOT NULL DEFAULT 1,
  size_sqft       SMALLINT UNSIGNED NULL,
  amenities       JSON NULL,
  image_url       VARCHAR(500) NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rooms_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE SET NULL,
  INDEX idx_rooms_hotel (hotel_id),
  INDEX idx_rooms_type (type),
  INDEX idx_rooms_price (price_per_night)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference    VARCHAR(20) NOT NULL UNIQUE,
  user_id      INT UNSIGNED NOT NULL,
  room_id      INT UNSIGNED NOT NULL,
  check_in     DATE NOT NULL,
  check_out    DATE NOT NULL,
  guests       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  total_price  DECIMAL(10,2) NOT NULL,
  status       ENUM('pending','confirmed','checked_in','checked_out','cancelled') NOT NULL DEFAULT 'pending',
  notes        VARCHAR(500) NULL,
  payment_status ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid',
  payment_method VARCHAR(30) NULL,
  paid_at      DATETIME NULL,
  payment_ref  VARCHAR(30) NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  INDEX idx_bookings_dates (room_id, check_in, check_out),
  INDEX idx_bookings_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employees (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hotel_id      INT UNSIGNED NOT NULL,
  name          VARCHAR(120) NOT NULL,
  designation   VARCHAR(80) NOT NULL,
  email         VARCHAR(160) NULL,
  phone         VARCHAR(30) NULL,
  salary        DECIMAL(10,2) NULL,
  joined_on     DATE NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_employees_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  INDEX idx_employees_hotel (hotel_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS feedback (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  hotel_id      INT UNSIGNED NULL,
  rating        TINYINT UNSIGNED NOT NULL,
  comment       TEXT NOT NULL,
  status        ENUM('new','reviewed') NOT NULL DEFAULT 'new',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_feedback_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE SET NULL,
  INDEX idx_feedback_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS enquiries (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL,
  phone         VARCHAR(30) NULL,
  hotel_id      INT UNSIGNED NULL,
  subject       VARCHAR(160) NOT NULL,
  message       TEXT NOT NULL,
  status        ENUM('new','in_progress','closed') NOT NULL DEFAULT 'new',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_enquiries_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE SET NULL,
  INDEX idx_enquiries_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_resets (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  token_hash    CHAR(64) NOT NULL UNIQUE,
  expires_at    DATETIME NOT NULL,
  used_at       DATETIME NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference     VARCHAR(30) NOT NULL UNIQUE,
  user_id       INT UNSIGNED NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  method        VARCHAR(30) NOT NULL,
  status        ENUM('success','failed') NOT NULL,
  failure_reason VARCHAR(200) NULL,
  booking_ids   VARCHAR(500) NOT NULL,
  card_last4    CHAR(4) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_payments_user (user_id)
) ENGINE=InnoDB;
