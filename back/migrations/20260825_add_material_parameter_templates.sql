-- MySQL 8+ idempotent migration for saved material-calculation settings.
USE `tg`;

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
