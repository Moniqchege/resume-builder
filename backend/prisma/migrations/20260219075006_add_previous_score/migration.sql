-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `username` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `image` VARCHAR(255) NULL,
    `provider` VARCHAR(50) NULL DEFAULT 'microsoft',
    `provider_id` VARCHAR(255) NULL,
    `plan` ENUM('FREE', 'PRO', 'ENTERPRISE') NULL DEFAULT 'FREE',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `email`(`email`),
    UNIQUE INDEX `username`(`username`),
    UNIQUE INDEX `provider_id`(`provider_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `token`(`token`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resumes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `original_filename` VARCHAR(255) NOT NULL,
    `original_file_url` VARCHAR(500) NOT NULL,
    `original_text` LONGTEXT NOT NULL,
    `optimized_text` LONGTEXT NULL,
    `version` INTEGER NULL DEFAULT 1,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_resumes_active`(`is_active`),
    INDEX `idx_resumes_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ats_analyses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `resume_id` INTEGER NOT NULL,
    `job_description` LONGTEXT NULL,
    `job_title` VARCHAR(255) NULL,
    `company_name` VARCHAR(255) NULL,
    `ats_score` INTEGER NOT NULL,
    `keyword_match_percentage` DECIMAL(5, 2) NULL,
    `missing_keywords` JSON NULL,
    `matched_keywords` JSON NULL,
    `improvement_suggestions` LONGTEXT NULL,
    `optimized_resume_text` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `previous_score` INTEGER NULL,

    INDEX `idx_ats_resume`(`resume_id`),
    INDEX `idx_ats_score`(`ats_score`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `resumes` ADD CONSTRAINT `fk_resumes_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ats_analyses` ADD CONSTRAINT `fk_ats_resume` FOREIGN KEY (`resume_id`) REFERENCES `resumes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
