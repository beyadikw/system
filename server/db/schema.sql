-- ============================================================
--  مشروع خذ بيدي — بوابة طلبات رعاية الفعاليات
--  مخطط قاعدة بيانات MySQL 8+
-- ============================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS khudh_biyadi
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE khudh_biyadi;

-- ---------- المستخدمون (فريق المشروع) ----------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(190)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('coordinator','admin','viewer') NOT NULL DEFAULT 'coordinator',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- القاعات ----------
CREATE TABLE IF NOT EXISTS halls (
  id        VARCHAR(20) PRIMARY KEY,
  name      VARCHAR(120) NOT NULL,
  note      VARCHAR(190),
  capacity  INT UNSIGNED NOT NULL DEFAULT 0,
  sort      INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- الفئات المستهدفة ----------
CREATE TABLE IF NOT EXISTS categories (
  id    VARCHAR(20) PRIMARY KEY,
  name  VARCHAR(80) NOT NULL,
  sort  INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- طلبات رعاية الفعاليات ----------
CREATE TABLE IF NOT EXISTS requests (
  id             VARCHAR(20) PRIMARY KEY,           -- مثال: BK-1042
  event_name     VARCHAR(200) NOT NULL,
  organization   VARCHAR(200) NOT NULL,
  lecturer       VARCHAR(160),
  hall_id        VARCHAR(20),
  status         ENUM('review','approved','rejected') NOT NULL DEFAULT 'review',
  phone          VARCHAR(40),
  instagram      VARCHAR(80),
  proposed_dates VARCHAR(160),
  days           INT UNSIGNED,
  goals          TEXT,
  axes           TEXT,
  notes          TEXT,
  reject_reason  TEXT,
  agreed_terms   TINYINT(1) NOT NULL DEFAULT 0,     -- الموافقة على الشروط والأحكام
  share_token    CHAR(36) UNIQUE,                   -- رمز رابط رفع التقرير للجهة المنفّذة
  submitted_at   DATE,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_req_hall FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- ربط الطلب بالفئات (متعدّد إلى متعدّد) ----------
CREATE TABLE IF NOT EXISTS request_categories (
  request_id  VARCHAR(20) NOT NULL,
  category_id VARCHAR(20) NOT NULL,
  PRIMARY KEY (request_id, category_id),
  CONSTRAINT fk_rc_req FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_rc_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- المرفقات (طلب موقّع، سيرة ذاتية، صور التقرير) ----------
CREATE TABLE IF NOT EXISTS attachments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_id  VARCHAR(20) NOT NULL,
  kind        ENUM('request_doc','cv','photo','video') NOT NULL,
  file_name   VARCHAR(255) NOT NULL,
  stored_path VARCHAR(255) NOT NULL,
  mime_type   VARCHAR(120),
  size_bytes  INT UNSIGNED,
  sort        INT NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_att_req FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
  INDEX idx_att_req_kind (request_id, kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- التقارير الختامية ----------
CREATE TABLE IF NOT EXISTS reports (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_id  VARCHAR(20) NOT NULL UNIQUE,
  attendees   INT UNSIGNED NOT NULL DEFAULT 0,
  capacity    INT UNSIGNED NOT NULL DEFAULT 0,
  has_video   TINYINT(1) NOT NULL DEFAULT 0,
  summary     TEXT,
  outcomes    TEXT,
  notes       TEXT,
  source      ENUM('internal','executor') NOT NULL DEFAULT 'internal', -- من رفع التقرير
  status      ENUM('pending','accepted') NOT NULL DEFAULT 'accepted',  -- pending = بانتظار قبول المنسّق
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rep_req FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- سجلّ الإشعارات البريدية ----------
CREATE TABLE IF NOT EXISTS email_log (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  to_email    VARCHAR(190) NOT NULL,
  subject     VARCHAR(255),
  template    VARCHAR(80),
  request_id  VARCHAR(20),
  status      ENUM('sent','failed','logged') NOT NULL DEFAULT 'logged',
  error       TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  عرض موحّد لإحصاءات لوحة المتابعة (اختياري للاستعلام السريع)
-- ============================================================
CREATE OR REPLACE VIEW v_request_summary AS
SELECT
  r.id, r.event_name, r.organization, r.lecturer, r.status,
  r.hall_id, h.name AS hall_name, h.capacity AS hall_capacity,
  r.proposed_dates, r.submitted_at,
  rep.attendees, rep.capacity AS report_capacity, rep.has_video,
  (rep.id IS NOT NULL) AS has_report
FROM requests r
LEFT JOIN halls h   ON h.id = r.hall_id
LEFT JOIN reports rep ON rep.request_id = r.id;
