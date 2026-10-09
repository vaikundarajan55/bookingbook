// Upgrades a database created by an older version of the app. Safe to run on every start.
// `run(sql, params)` must resolve to the result rows (works with a pool or a single connection).
const columnsOf = async (run, table) => (await run(
  'SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
  [table],
)).map((c) => c.name);

export const migrate = async (run) => {
  await run(`CREATE TABLE IF NOT EXISTS hotels (
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
  ) ENGINE=InnoDB`);

  const columns = await columnsOf(run, 'rooms');

  if (!columns.includes('hotel_id')) {
    await run(`ALTER TABLE rooms
      ADD COLUMN hotel_id INT UNSIGNED NULL AFTER id,
      ADD INDEX idx_rooms_hotel (hotel_id),
      ADD CONSTRAINT fk_rooms_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE SET NULL`);
  }
  if (!columns.includes('is_ac')) {
    await run('ALTER TABLE rooms ADD COLUMN is_ac TINYINT(1) NOT NULL DEFAULT 1 AFTER capacity');
  }

  if (!(await columnsOf(run, 'bookings')).includes('payment_status')) {
    await run(`ALTER TABLE bookings
      ADD COLUMN payment_status ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid' AFTER notes,
      ADD COLUMN payment_method VARCHAR(30) NULL AFTER payment_status,
      ADD COLUMN paid_at DATETIME NULL AFTER payment_method`);
  }

  await run(`CREATE TABLE IF NOT EXISTS employees (
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
  ) ENGINE=InnoDB`);

  await run(`CREATE TABLE IF NOT EXISTS feedback (
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
  ) ENGINE=InnoDB`);

  await run(`CREATE TABLE IF NOT EXISTS enquiries (
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
  ) ENGINE=InnoDB`);

  if (!(await columnsOf(run, 'bookings')).includes('payment_ref')) {
    await run('ALTER TABLE bookings ADD COLUMN payment_ref VARCHAR(30) NULL AFTER paid_at');
  }

  await run(`CREATE TABLE IF NOT EXISTS password_resets (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL,
    token_hash    CHAR(64) NOT NULL UNIQUE,
    expires_at    DATETIME NOT NULL,
    used_at       DATETIME NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);

  await run(`CREATE TABLE IF NOT EXISTS payments (
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
  ) ENGINE=InnoDB`);

  // Every room needs a hotel: create a default one and attach any rooms that have none.
  const [{ total }] = await run('SELECT COUNT(*) AS total FROM hotels');
  if (total === 0) {
    await run(
      'INSERT INTO hotels (name, city, address, phone, star_rating, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Harbourline Marina', 'Chennai', '12 Marina Beach Road', '+91 44 4000 1000', 5,
        'Our flagship seafront hotel with marina views, a rooftop pool and an all-day dining restaurant.',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'],
    );
  }
  await run('UPDATE rooms SET hotel_id = (SELECT MIN(id) FROM hotels) WHERE hotel_id IS NULL');
};
