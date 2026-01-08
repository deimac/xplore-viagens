-- ============================================
-- BACKUP COMPLETO - XPLORE VIAGENS
-- Data: 27/11/2025
-- ============================================

-- Desabilitar verificações de chave estrangeira durante a importação
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ============================================
-- ESTRUTURA DAS TABELAS
-- ============================================

-- Tabela: users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `openId` varchar(64) NOT NULL,
  `name` text,
  `email` varchar(320) DEFAULT NULL,
  `loginMethod` varchar(64) DEFAULT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `openId` (`openId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela: categories
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `icon` varchar(100) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela: travels
DROP TABLE IF EXISTS `travels`;
CREATE TABLE `travels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `origin` varchar(255) NOT NULL,
  `departureDate` varchar(50) DEFAULT NULL,
  `returnDate` varchar(50) DEFAULT NULL,
  `travelers` varchar(100) DEFAULT NULL,
  `price` varchar(100) NOT NULL,
  `imageUrl` text,
  `promotion` varchar(30) DEFAULT NULL,
  `promotionColor` varchar(20) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela: travelCategories
DROP TABLE IF EXISTS `travelCategories`;
CREATE TABLE `travelCategories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `travelId` int NOT NULL,
  `categoryId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `travelId` (`travelId`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `travelCategories_ibfk_1` FOREIGN KEY (`travelId`) REFERENCES `travels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `travelCategories_ibfk_2` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela: companySettings
DROP TABLE IF EXISTS `companySettings`;
CREATE TABLE `companySettings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `companyName` varchar(255) NOT NULL,
  `cnpj` varchar(20) DEFAULT NULL,
  `foundedDate` varchar(20) DEFAULT NULL,
  `email` varchar(320) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `instagram` text,
  `facebook` text,
  `linkedin` text,
  `twitter` text,
  `quotationLink` text,
  `googleAnalyticsId` varchar(50) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Reabilitar verificações de chave estrangeira
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- DADOS DAS TABELAS
-- ============================================

-- Dados: categories
INSERT INTO `categories` (`id`, `name`, `description`, `icon`, `createdAt`, `updatedAt`) VALUES
(1, 'Pacotes', 'Pacotes completos de viagem', 'package', '2025-11-27 12:00:00', '2025-11-27 12:00:00'),
(2, 'Passagens', 'Passagens aéreas', 'plane', '2025-11-27 12:00:00', '2025-11-27 12:00:00'),
(3, 'Hospedagens', 'Hotéis e pousadas', 'hotel', '2025-11-27 12:00:00', '2025-11-27 12:00:00'),
(4, 'Black Friday', 'Ofertas especiais Black Friday', 'tag', '2025-11-27 12:00:00', '2025-11-27 12:00:00'),
(5, 'Promoção', 'Promoções e descontos', 'percent', '2025-11-27 12:00:00', '2025-11-27 12:00:00');

-- Dados: travels
INSERT INTO `travels` (`id`, `title`, `description`, `origin`, `departureDate`, `returnDate`, `travelers`, `price`, `imageUrl`, `promotion`, `promotionColor`, `createdAt`, `updatedAt`) VALUES
(1, 'Paris', 'Conheça a Cidade Luz e seus encantos', 'São Paulo', '15/12/2025', '22/12/2025', '15', '5000.00', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', '15% OFF', '#EF4444', '2025-11-27 12:00:00', '2025-11-27 12:00:00'),
(2, 'Nova York', 'Explore a Big Apple', 'Rio de Janeiro', '10/01/2026', '17/01/2026', '20', '6500.00', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800', NULL, NULL, '2025-11-27 12:00:00', '2025-11-27 12:00:00'),
(3, 'Dubai', 'Luxo e modernidade no deserto', 'Brasília', '10/02/2026', '18/02/2026', '2', '8000.00', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', 'Oferta Imperdível', '#F97316', '2025-11-27 12:00:00', '2025-11-27 12:00:00'),
(4, 'Tóquio', 'Tradição e tecnologia', 'São Paulo', '05/03/2026', '15/03/2026', '10', '7500.00', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', 'Exclusivo', '#8B5CF6', '2025-11-27 12:00:00', '2025-11-27 12:00:00'),
(5, 'Bali', 'Paraíso tropical', 'Rio de Janeiro', '20/04/2026', '30/04/2026', '8', '4500.00', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', NULL, NULL, '2025-11-27 12:00:00', '2025-11-27 12:00:00'),
(6, 'Londres', 'História e cultura britânica', 'São Paulo', '15/05/2026', '22/05/2026', '12', '5500.00', 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', NULL, NULL, '2025-11-27 12:00:00', '2025-11-27 12:00:00');

-- Dados: travelCategories
INSERT INTO `travelCategories` (`travelId`, `categoryId`, `createdAt`) VALUES
(1, 1, '2025-11-27 12:00:00'),
(1, 5, '2025-11-27 12:00:00'),
(2, 1, '2025-11-27 12:00:00'),
(3, 1, '2025-11-27 12:00:00'),
(3, 5, '2025-11-27 12:00:00'),
(4, 1, '2025-11-27 12:00:00'),
(5, 1, '2025-11-27 12:00:00'),
(6, 1, '2025-11-27 12:00:00');

-- Dados: companySettings
INSERT INTO `companySettings` (`id`, `companyName`, `cnpj`, `foundedDate`, `email`, `phone`, `whatsapp`, `instagram`, `facebook`, `linkedin`, `twitter`, `quotationLink`, `googleAnalyticsId`, `createdAt`, `updatedAt`) VALUES
(1, 'Xplore Viagens', NULL, NULL, 'contato@xplore.com.br', '(11) 1234-5678', '(11) 91234-5678', 'https://instagram.com/xplore', 'https://facebook.com/xplore', 'https://linkedin.com/company/xplore', 'https://twitter.com/xplore', NULL, 'G-XXXXXXXXXX', '2025-11-27 12:00:00', '2025-11-27 12:00:00');

-- ============================================
-- FIM DO BACKUP
-- ============================================
