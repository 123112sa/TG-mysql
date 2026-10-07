CREATE DATABASE IF NOT EXISTS `tg`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE `tg`;

CREATE TABLE IF NOT EXISTS `users` (
    `ID` VARCHAR(64) NOT NULL PRIMARY KEY,
    `PASSWORD` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `input` (
    `input_name` VARCHAR(64) NOT NULL PRIMARY KEY,
    `input_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `type` VARCHAR(16) NOT NULL DEFAULT 'V'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `assay` (
    `equipment` VARCHAR(64) NOT NULL PRIMARY KEY,
    `assay` DECIMAL(18, 8) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ratio` (
    `input_name` VARCHAR(64) NOT NULL PRIMARY KEY,
    `ratio` DECIMAL(18, 8) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `output` (
    `output_name` VARCHAR(64) NOT NULL PRIMARY KEY,
    `output_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `type` VARCHAR(16) NOT NULL DEFAULT 'V'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `input_reverse` (
    `input_name` VARCHAR(64) NOT NULL PRIMARY KEY,
    `input_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `type` VARCHAR(16) NOT NULL DEFAULT 'V'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `output_reverse` (
    `output_name` VARCHAR(64) NOT NULL PRIMARY KEY,
    `output_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `type` VARCHAR(16) NOT NULL DEFAULT 'V'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `schedule_plan` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `plan_name` VARCHAR(128) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `planning_days` INT NOT NULL,
    `target_amount` DECIMAL(18, 6) NOT NULL,
    `route` VARCHAR(16) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
    `remark` VARCHAR(500) NOT NULL DEFAULT '',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_schedule_plan_name` (`plan_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `schedule_result` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `plan_id` BIGINT NOT NULL,
    `schedule_date` DATE NOT NULL,
    `day_index` INT NOT NULL,
    `jb_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `mxx_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `ldx_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `dnx_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `sa_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `fsa_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `ylsn_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `nx_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `product_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `mxxflc_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `x2_2d_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `cztg_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `txxhcc_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `yttg_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `tg_amount` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    KEY `ix_schedule_result_plan_day` (`plan_id`, `day_index`),
    CONSTRAINT `fk_schedule_result_plan` FOREIGN KEY (`plan_id`)
        REFERENCES `schedule_plan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `material_calculation_context` (
    `solve_mode` VARCHAR(32) NOT NULL PRIMARY KEY,
    `route` VARCHAR(16) NOT NULL,
    `version` INT NOT NULL DEFAULT 1,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `material_parameter_template` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `template_name` VARCHAR(128) NOT NULL,
    `description` VARCHAR(500) NOT NULL DEFAULT '',
    `solve_mode` VARCHAR(32) NOT NULL,
    `route` VARCHAR(16) NOT NULL,
    `target_product_code` VARCHAR(64) NULL,
    `target_amount` DECIMAL(18, 6) NULL,
    `version` INT NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `uk_material_template_name` UNIQUE (`template_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `material_parameter_template_item` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `template_id` BIGINT NOT NULL,
    `material_code` VARCHAR(32) NOT NULL,
    `input_amount` DECIMAL(18, 6) NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    CONSTRAINT `fk_material_template_item` FOREIGN KEY (`template_id`)
        REFERENCES `material_parameter_template` (`id`) ON DELETE CASCADE,
    CONSTRAINT `uk_material_template_item` UNIQUE (`template_id`, `material_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
