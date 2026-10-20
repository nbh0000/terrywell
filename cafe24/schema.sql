CREATE TABLE IF NOT EXISTS `auth_users` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(191) NOT NULL DEFAULT '',
  `sns_provider` VARCHAR(32) NULL,
  `sns_id` VARCHAR(191) NULL,
  `reset_token` VARCHAR(191) NULL,
  `reset_expires` BIGINT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_users_email` (`email`),
  KEY `auth_users_sns` (`sns_provider`, `sns_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `profiles` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL DEFAULT '',
  `name` VARCHAR(191) NOT NULL DEFAULT '',
  `phone` VARCHAR(191) NOT NULL DEFAULT '',
  `role` VARCHAR(191) NOT NULL DEFAULT '',
  `company_name` VARCHAR(191) NOT NULL DEFAULT '',
  `business_number` VARCHAR(191) NOT NULL DEFAULT '',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `profiles_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL DEFAULT '',
  `name` VARCHAR(191) NOT NULL DEFAULT '',
  `sort_order` BIGINT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL DEFAULT '',
  `name_en` VARCHAR(191) NOT NULL DEFAULT '',
  `name_ko` VARCHAR(191) NOT NULL DEFAULT '',
  `category_slugs` LONGTEXT NOT NULL,
  `is_visible` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` BIGINT NOT NULL DEFAULT 0,
  `images` LONGTEXT NOT NULL,
  `specs` LONGTEXT NOT NULL,
  `spec_note` LONGTEXT NOT NULL,
  `towel_size` VARCHAR(191) NOT NULL DEFAULT '',
  `detail_html` LONGTEXT NOT NULL,
  `detail_images` LONGTEXT NOT NULL,
  `notice_html` LONGTEXT NOT NULL,
  `guide_html` LONGTEXT NOT NULL,
  `shipping_info` LONGTEXT NOT NULL,
  `base_price` BIGINT NOT NULL DEFAULT 0,
  `vat_included` TINYINT(1) NOT NULL DEFAULT 0,
  `allow_editor` TINYINT(1) NOT NULL DEFAULT 0,
  `allow_upload` TINYINT(1) NOT NULL DEFAULT 0,
  `label_width_mm` DOUBLE NOT NULL DEFAULT 0,
  `label_height_mm` DOUBLE NOT NULL DEFAULT 0,
  `label_bleed_mm` DOUBLE NOT NULL DEFAULT 0,
  `label_safe_mm` DOUBLE NOT NULL DEFAULT 0,
  `label_corner_mm` DOUBLE NOT NULL DEFAULT 0,
  `label_pages` BIGINT NOT NULL DEFAULT 0,
  `allow_pages` TINYINT(1) NOT NULL DEFAULT 0,
  `qty_step` BIGINT NOT NULL DEFAULT 0,
  `released_at` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `products_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_colors` (
  `id` VARCHAR(191) NOT NULL,
  `product_id` VARCHAR(191) NOT NULL DEFAULT '',
  `name` VARCHAR(191) NOT NULL DEFAULT '',
  `swatch` VARCHAR(191) NOT NULL DEFAULT '',
  `images` LONGTEXT NOT NULL,
  `mockup_url` VARCHAR(191) NULL,
  `label_x` DOUBLE NOT NULL DEFAULT 0,
  `label_y` DOUBLE NOT NULL DEFAULT 0,
  `label_w` DOUBLE NOT NULL DEFAULT 0,
  `label_rotate` DOUBLE NOT NULL DEFAULT 0,
  `is_mix` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `product_colors_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_price_tiers` (
  `id` VARCHAR(191) NOT NULL,
  `product_id` VARCHAR(191) NOT NULL DEFAULT '',
  `min_qty` BIGINT NOT NULL DEFAULT 0,
  `unit_price` BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `product_price_tiers_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_files` (
  `id` VARCHAR(191) NOT NULL,
  `product_id` VARCHAR(191) NOT NULL DEFAULT '',
  `kind` VARCHAR(191) NOT NULL DEFAULT '',
  `name` VARCHAR(191) NOT NULL DEFAULT '',
  `url` VARCHAR(191) NOT NULL DEFAULT '',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `product_files_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `templates` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL DEFAULT '',
  `category` VARCHAR(191) NOT NULL DEFAULT '',
  `product_id` VARCHAR(191) NULL,
  `canvas_json` LONGTEXT NOT NULL,
  `thumbnail_url` VARCHAR(191) NULL,
  `is_visible` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` BIGINT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stickers` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL DEFAULT '',
  `category` VARCHAR(191) NOT NULL DEFAULT '',
  `url` VARCHAR(191) NOT NULL DEFAULT '',
  `sort_order` BIGINT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `designs` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL DEFAULT '',
  `product_id` VARCHAR(191) NOT NULL DEFAULT '',
  `color_id` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL DEFAULT '',
  `canvas_json` LONGTEXT NOT NULL,
  `thumbnail_url` VARCHAR(191) NULL,
  `print_png_url` VARCHAR(191) NULL,
  `print_pdf_url` VARCHAR(191) NULL,
  `print_cmyk_url` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `designs_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `design_uploads` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL DEFAULT '',
  `product_id` VARCHAR(191) NOT NULL DEFAULT '',
  `file_name` VARCHAR(191) NOT NULL DEFAULT '',
  `file_size` BIGINT NOT NULL DEFAULT 0,
  `storage_path` VARCHAR(191) NOT NULL DEFAULT '',
  `agreed_at` VARCHAR(191) NOT NULL DEFAULT '',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `design_uploads_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wishlists` (
  `user_id` VARCHAR(191) NOT NULL,
  `product_id` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL DEFAULT '',
  `product_id` VARCHAR(191) NOT NULL DEFAULT '',
  `color_id` VARCHAR(191) NULL,
  `design_id` VARCHAR(191) NULL,
  `upload_id` VARCHAR(191) NULL,
  `quantity` BIGINT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `cart_items_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(191) NOT NULL,
  `order_no` VARCHAR(191) NOT NULL DEFAULT '',
  `user_id` VARCHAR(191) NOT NULL DEFAULT '',
  `status` VARCHAR(191) NOT NULL DEFAULT '',
  `supply_amount` BIGINT NOT NULL DEFAULT 0,
  `vat_amount` BIGINT NOT NULL DEFAULT 0,
  `total_amount` BIGINT NOT NULL DEFAULT 0,
  `shipping_fee` BIGINT NOT NULL DEFAULT 0,
  `recipient` LONGTEXT NOT NULL,
  `tax_invoice` LONGTEXT NULL,
  `payment` LONGTEXT NULL,
  `tracking_no` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `orders_user_id` (`user_id`),
  KEY `orders_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` VARCHAR(191) NOT NULL,
  `order_id` VARCHAR(191) NOT NULL DEFAULT '',
  `product_id` VARCHAR(191) NOT NULL DEFAULT '',
  `product_name` VARCHAR(191) NOT NULL DEFAULT '',
  `color_name` VARCHAR(191) NULL,
  `design_id` VARCHAR(191) NULL,
  `upload_id` VARCHAR(191) NULL,
  `quantity` BIGINT NOT NULL DEFAULT 0,
  `unit_price` BIGINT NOT NULL DEFAULT 0,
  `line_amount` BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quote_requests` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NULL,
  `company` VARCHAR(191) NOT NULL DEFAULT '',
  `name` VARCHAR(191) NOT NULL DEFAULT '',
  `phone` VARCHAR(191) NOT NULL DEFAULT '',
  `email` VARCHAR(191) NOT NULL DEFAULT '',
  `product` VARCHAR(191) NOT NULL DEFAULT '',
  `quantity` VARCHAR(191) NOT NULL DEFAULT '',
  `due_date` VARCHAR(191) NOT NULL DEFAULT '',
  `message` LONGTEXT NOT NULL,
  `attachments` LONGTEXT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT '',
  `admin_memo` LONGTEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notices` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL DEFAULT '',
  `body_html` LONGTEXT NOT NULL,
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `faqs` (
  `id` VARCHAR(191) NOT NULL,
  `category` VARCHAR(191) NOT NULL DEFAULT '',
  `question` VARCHAR(191) NOT NULL DEFAULT '',
  `answer_html` LONGTEXT NOT NULL,
  `is_visible` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` BIGINT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inquiries` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL DEFAULT '',
  `type` VARCHAR(191) NOT NULL DEFAULT '',
  `order_no` VARCHAR(191) NOT NULL DEFAULT '',
  `title` VARCHAR(191) NOT NULL DEFAULT '',
  `body` LONGTEXT NOT NULL,
  `attachments` LONGTEXT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT '',
  `answer_html` LONGTEXT NOT NULL,
  `answered_at` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `inquiries_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_generations` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL DEFAULT '',
  `prompt` LONGTEXT NOT NULL,
  `style` VARCHAR(191) NOT NULL DEFAULT '',
  `provider` VARCHAR(191) NOT NULL DEFAULT '',
  `result_paths` LONGTEXT NOT NULL,
  `success` TINYINT(1) NOT NULL DEFAULT 0,
  `error` LONGTEXT NULL,
  `cost_estimate` BIGINT NOT NULL DEFAULT 0,
  `kst_date` VARCHAR(191) NOT NULL DEFAULT '',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ai_generations_user_id` (`user_id`),
  KEY `ai_generations_kst_date` (`kst_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `site_settings` (
  `key` VARCHAR(191) NOT NULL,
  `value` LONGTEXT NOT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `site_contents` (
  `key` VARCHAR(191) NOT NULL,
  `value` LONGTEXT NOT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
