CREATE DATABASE  IF NOT EXISTS `legacycaredb` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `legacycaredb`;
-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: legacycaredb
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `beneficiary`
--

DROP TABLE IF EXISTS `beneficiary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `beneficiary` (
  `BeneficiaryID` int NOT NULL AUTO_INCREMENT,
  `fullName` varchar(500) NOT NULL,
  `IDNumber` varchar(13) NOT NULL,
  `Status` enum('Alive','Deceased') NOT NULL DEFAULT 'Alive',
  `PolicyID` int NOT NULL,
  PRIMARY KEY (`BeneficiaryID`),
  UNIQUE KEY `BeneficiaryID_UNIQUE` (`BeneficiaryID`),
  KEY `fk_beneficiary_policy_idx` (`PolicyID`),
  CONSTRAINT `fk_beneficiary_policy` FOREIGN KEY (`PolicyID`) REFERENCES `policy` (`PolicyID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `blackoutdate`
--

DROP TABLE IF EXISTS `blackoutdate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blackoutdate` (
  `BlackoutDateID` int NOT NULL AUTO_INCREMENT,
  `blackoutDate` date NOT NULL,
  `reason` text NOT NULL,
  PRIMARY KEY (`BlackoutDateID`),
  UNIQUE KEY `BlackoutDate_UNIQUE` (`BlackoutDateID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bookingrestriction`
--

DROP TABLE IF EXISTS `bookingrestriction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookingrestriction` (
  `BookingRestrictionID` int NOT NULL AUTO_INCREMENT,
  `maxDailyEvents` int NOT NULL,
  `minAdvanceBookingDays` int NOT NULL,
  `eventStartTime` time NOT NULL,
  `eventEndTime` time NOT NULL,
  PRIMARY KEY (`BookingRestrictionID`),
  UNIQUE KEY `BookingRestrictionID_UNIQUE` (`BookingRestrictionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `branch`
--

DROP TABLE IF EXISTS `branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branch` (
  `BranchID` int NOT NULL AUTO_INCREMENT,
  `name` varchar(250) NOT NULL,
  `address` varchar(500) NOT NULL,
  `contactNo` varchar(10) NOT NULL,
  `email` varchar(250) NOT NULL,
  PRIMARY KEY (`BranchID`),
  UNIQUE KEY `BranchID_UNIQUE` (`BranchID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `CategoryID` int NOT NULL AUTO_INCREMENT,
  `categoryName` varchar(250) NOT NULL,
  PRIMARY KEY (`CategoryID`),
  UNIQUE KEY `CategoryID_UNIQUE` (`CategoryID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `client`
--

DROP TABLE IF EXISTS `client`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client` (
  `ClientID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  PRIMARY KEY (`ClientID`),
  UNIQUE KEY `ClientID_UNIQUE` (`ClientID`),
  KEY `fk_client_user_idx` (`UserID`),
  CONSTRAINT `fk_client_user` FOREIGN KEY (`UserID`) REFERENCES `user` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deceased`
--

DROP TABLE IF EXISTS `deceased`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deceased` (
  `DeceasedID` int NOT NULL AUTO_INCREMENT,
  `arrivalDate` datetime NOT NULL,
  `collectionPlace` varchar(500) NOT NULL,
  `dateOfDeath` datetime NOT NULL,
  `BeneficiaryID` int NOT NULL,
  PRIMARY KEY (`DeceasedID`),
  UNIQUE KEY `DeceasedID_UNIQUE` (`DeceasedID`),
  KEY `fk_deceased_beneficiary_idx` (`BeneficiaryID`),
  CONSTRAINT `fk_deceased_beneficiary` FOREIGN KEY (`BeneficiaryID`) REFERENCES `beneficiary` (`BeneficiaryID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deceasedstorage`
--

DROP TABLE IF EXISTS `deceasedstorage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deceasedstorage` (
  `DeceasedStorageID` varchar(250) NOT NULL,
  `dateAssigned` date NOT NULL,
  `dateRemoved` date NOT NULL,
  `DeceasedID` int NOT NULL,
  `StorageID` int NOT NULL,
  PRIMARY KEY (`DeceasedStorageID`),
  KEY `fk_deceasedstorage_deceased_idx` (`DeceasedID`),
  KEY `fk_deceasedstorage_storage_idx` (`StorageID`),
  CONSTRAINT `fk_deceasedstorage_deceased` FOREIGN KEY (`DeceasedID`) REFERENCES `deceased` (`DeceasedID`),
  CONSTRAINT `fk_deceasedstorage_storage` FOREIGN KEY (`StorageID`) REFERENCES `storage` (`StorageID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `docupload`
--

DROP TABLE IF EXISTS `docupload`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `docupload` (
  `DocUploadID` int NOT NULL AUTO_INCREMENT,
  `filePath` varchar(500) NOT NULL,
  `docType` varchar(250) NOT NULL,
  `uploadDate` date NOT NULL,
  `status` enum('Pending','Successful','Failed') NOT NULL DEFAULT 'Pending',
  `ClientID` int NOT NULL,
  PRIMARY KEY (`DocUploadID`),
  UNIQUE KEY `DocUploadID_UNIQUE` (`DocUploadID`),
  KEY `fk_docupload_client_idx` (`ClientID`),
  CONSTRAINT `fk_docupload_client` FOREIGN KEY (`ClientID`) REFERENCES `client` (`ClientID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `event`
--

DROP TABLE IF EXISTS `event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event` (
  `EventID` int NOT NULL AUTO_INCREMENT,
  `eventType` enum('Appointment','Funeral','Memorial','Parlour-related') NOT NULL,
  `eventDate` date NOT NULL,
  `address` varchar(250) NOT NULL,
  `appointmentPurpose` text,
  `deceasedID` int DEFAULT NULL,
  PRIMARY KEY (`EventID`),
  UNIQUE KEY `eventID_UNIQUE` (`EventID`),
  KEY `fk_event_deceased_idx` (`deceasedID`),
  CONSTRAINT `fk_event_deceased` FOREIGN KEY (`deceasedID`) REFERENCES `deceased` (`DeceasedID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `eventstaff`
--

DROP TABLE IF EXISTS `eventstaff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventstaff` (
  `EventID` int NOT NULL,
  `StaffID` int NOT NULL,
  PRIMARY KEY (`EventID`,`StaffID`),
  KEY `fk_eventstaff_staff_idx` (`StaffID`),
  CONSTRAINT `fk_eventstaff_event` FOREIGN KEY (`EventID`) REFERENCES `event` (`EventID`),
  CONSTRAINT `fk_eventstaff_staff` FOREIGN KEY (`StaffID`) REFERENCES `staff` (`StaffID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invoice`
--

DROP TABLE IF EXISTS `invoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice` (
  `InvoiceID` int NOT NULL AUTO_INCREMENT,
  `invoiceDate` date NOT NULL,
  `pdfPath` varchar(500) NOT NULL,
  `PaymentID` int NOT NULL,
  PRIMARY KEY (`InvoiceID`),
  UNIQUE KEY `InvoiceID_UNIQUE` (`InvoiceID`),
  KEY `fk_invoice_payment_idx` (`PaymentID`),
  CONSTRAINT `fk_invoice_payment` FOREIGN KEY (`PaymentID`) REFERENCES `payment` (`PaymentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `item`
--

DROP TABLE IF EXISTS `item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item` (
  `ItemID` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(250) NOT NULL,
  `quantity` int NOT NULL,
  `image` varchar(250) NOT NULL,
  `categoryID` int NOT NULL,
  `packageID` int NOT NULL,
  PRIMARY KEY (`ItemID`),
  UNIQUE KEY `ItemID_UNIQUE` (`ItemID`),
  KEY `fk_item_category_idx` (`categoryID`),
  KEY `fk_item_package_idx` (`packageID`),
  CONSTRAINT `fk_item_category` FOREIGN KEY (`categoryID`) REFERENCES `category` (`CategoryID`),
  CONSTRAINT `fk_item_package` FOREIGN KEY (`packageID`) REFERENCES `package` (`PackageID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `NotificationID` int NOT NULL AUTO_INCREMENT,
  `title` varchar(500) NOT NULL,
  `message` text NOT NULL,
  `dateTime` datetime NOT NULL,
  `status` enum('Unread','Read') NOT NULL DEFAULT 'Unread',
  `UserID` int NOT NULL,
  PRIMARY KEY (`NotificationID`),
  UNIQUE KEY `NotificationID_UNIQUE` (`NotificationID`),
  KEY `fk_notification_user_idx` (`UserID`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`UserID`) REFERENCES `user` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `package`
--

DROP TABLE IF EXISTS `package`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `package` (
  `PackageID` int NOT NULL AUTO_INCREMENT,
  `packageName` enum('Basic','Standard','Premium','Luxury') NOT NULL,
  `packageDescription` text NOT NULL,
  `maxBeneficiaries` int NOT NULL,
  `packagePrice` decimal(10,2) NOT NULL,
  PRIMARY KEY (`PackageID`),
  UNIQUE KEY `PackageID_UNIQUE` (`PackageID`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment` (
  `PaymentID` int NOT NULL AUTO_INCREMENT,
  `Amount` decimal(10,0) NOT NULL,
  `paymentDate` date NOT NULL,
  `method` enum('Cash','Card','EFT') NOT NULL,
  `status` enum('Pending','Failed','Successful') NOT NULL DEFAULT 'Pending',
  `PolicyID` int NOT NULL,
  PRIMARY KEY (`PaymentID`),
  UNIQUE KEY `PaymentID_UNIQUE` (`PaymentID`),
  KEY `fk_payment_policy_idx` (`PolicyID`),
  CONSTRAINT `fk_payment_policy` FOREIGN KEY (`PolicyID`) REFERENCES `policy` (`PolicyID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `policy`
--

DROP TABLE IF EXISTS `policy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `policy` (
  `PolicyID` int NOT NULL AUTO_INCREMENT,
  `startDate` date NOT NULL,
  `endDate` date DEFAULT NULL,
  `status` enum('Active','Inactive','Discontinued') NOT NULL DEFAULT 'Active',
  `ClientID` int NOT NULL,
  `PackageID` int NOT NULL,
  PRIMARY KEY (`PolicyID`),
  UNIQUE KEY `PolicyID_UNIQUE` (`PolicyID`),
  KEY `fk_policy_package_idx` (`PackageID`),
  KEY `fk_policy_client_idx` (`ClientID`),
  CONSTRAINT `fk_policy_client` FOREIGN KEY (`ClientID`) REFERENCES `client` (`ClientID`),
  CONSTRAINT `fk_policy_package` FOREIGN KEY (`PackageID`) REFERENCES `package` (`PackageID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `RoleID` int NOT NULL AUTO_INCREMENT,
  `RoleName` varchar(250) NOT NULL,
  PRIMARY KEY (`RoleID`),
  UNIQUE KEY `RoleID_UNIQUE` (`RoleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `StaffID` int NOT NULL AUTO_INCREMENT,
  `type` enum('Clerk','Driver','Mortuary Attendant','On-Site Staff','Pallbearer','Admin') NOT NULL,
  `hireDate` date NOT NULL,
  `salary` double NOT NULL,
  `isCovered` tinyint NOT NULL DEFAULT '1',
  `UserID` int NOT NULL,
  `BranchID` int NOT NULL,
  PRIMARY KEY (`StaffID`),
  UNIQUE KEY `StaffID_UNIQUE` (`StaffID`),
  KEY `fk_staff_branch_idx` (`BranchID`),
  KEY `fk_staff_user_idx` (`UserID`),
  CONSTRAINT `fk_staff_branch` FOREIGN KEY (`BranchID`) REFERENCES `branch` (`BranchID`),
  CONSTRAINT `fk_staff_user` FOREIGN KEY (`UserID`) REFERENCES `user` (`UserID`),
  CONSTRAINT `chk_isCovered` CHECK ((`isCovered` in (0,1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `storage`
--

DROP TABLE IF EXISTS `storage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `storage` (
  `StorageID` int NOT NULL AUTO_INCREMENT,
  `unitNumber` varchar(250) NOT NULL,
  `isAvailable` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`StorageID`),
  UNIQUE KEY `StorageID_UNIQUE` (`StorageID`),
  CONSTRAINT `chk_isAvailable` CHECK ((`isAvailable` in (0,1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `task`
--

DROP TABLE IF EXISTS `task`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task` (
  `TaskID` int NOT NULL AUTO_INCREMENT,
  `taskName` varchar(250) NOT NULL,
  `taskDescription` text NOT NULL,
  `startTime` time NOT NULL,
  `finishTime` time NOT NULL,
  `progress` enum('Not Started','In Progress','Completed') NOT NULL DEFAULT 'Not Started',
  `proofImage` varchar(500) NOT NULL,
  `staffID` int NOT NULL,
  `deceasedID` int DEFAULT NULL,
  `eventID` int DEFAULT NULL,
  PRIMARY KEY (`TaskID`),
  UNIQUE KEY `TaskID_UNIQUE` (`TaskID`),
  KEY `fk_task_deceased_idx` (`deceasedID`),
  KEY `fk_task_staff_idx` (`staffID`),
  KEY `fk_task_event_idx` (`eventID`),
  CONSTRAINT `fk_task_deceased` FOREIGN KEY (`deceasedID`) REFERENCES `deceased` (`DeceasedID`),
  CONSTRAINT `fk_task_event` FOREIGN KEY (`eventID`) REFERENCES `event` (`EventID`),
  CONSTRAINT `fk_task_staff` FOREIGN KEY (`staffID`) REFERENCES `staff` (`StaffID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `fullName` varchar(250) NOT NULL,
  `IDNumber` varchar(13) NOT NULL,
  `cellNo` varchar(10) NOT NULL,
  `address` varchar(500) NOT NULL,
  `email` varchar(250) NOT NULL,
  `passwordHashed` varchar(250) NOT NULL,
  `dateCreated` time NOT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `UserID_UNIQUE` (`UserID`),
  CONSTRAINT `chk_isActive` CHECK ((`isActive` in (0,1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `userrole`
--

DROP TABLE IF EXISTS `userrole`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userrole` (
  `UserID` int NOT NULL,
  `RoleID` int NOT NULL,
  PRIMARY KEY (`UserID`,`RoleID`),
  KEY `fk_userrole_role_idx` (`RoleID`),
  CONSTRAINT `fk_userrole_role` FOREIGN KEY (`RoleID`) REFERENCES `role` (`RoleID`),
  CONSTRAINT `fk_userrole_user` FOREIGN KEY (`UserID`) REFERENCES `user` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-15  0:34:16
