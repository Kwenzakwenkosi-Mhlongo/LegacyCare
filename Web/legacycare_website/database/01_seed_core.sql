INSERT INTO role (RoleName)
VALUES
('Client'),
('Staff'),
('Clerk'),
('Admin');

INSERT INTO branch (name, address, contactNo, email)
VALUES
('Johannesburg Central', '12 Main Street, Johannesburg', '0712345678', 'jhb@legacycare.co.za'),
('Soweto Branch', '45 Vilakazi Street, Soweto', '0723456789', 'soweto@legacycare.co.za'),
('Pretoria Branch', '88 Church Street, Pretoria', '0734567890', 'pta@legacycare.co.za'),
('Midrand Branch', '10 Corporate Ave, Midrand', '0745678901', 'midrand@legacycare.co.za'),
('Sandton Branch', '1 Rivonia Road, Sandton', '0756789012', 'sandton@legacycare.co.za');

INSERT INTO category (categoryName)
VALUES
('Coffin'),
('Tent'),
('Vehicle'),
('Furniture'),
('Catering'),
('Printing'),
('Floral Arrangement'),
('Monument / Grave Items');

INSERT INTO package (packageName, packageDescription, maxBeneficiaries, packagePrice)
VALUES
('Basic',
'The Basic Package provides essential funeral services for individuals and small families. It includes funeral administration, transportation of the deceased, and a standard coffin. This package is designed to offer a dignified farewell at an affordable cost.',
5, 250.00),
('Standard',
'The Standard Package includes all services offered in the Basic Package with additional support and funeral arrangements. Families receive a wider selection of coffins and assistance with ceremony planning. It is ideal for those seeking a more comprehensive service while remaining cost-effective.',
10, 500.00),
('Premium',
'The Premium Package offers an enhanced funeral experience with additional ceremonial and logistical services. It includes premium coffin options, improved transportation arrangements, and greater support for family members. This package is suited to larger families who desire a more personalized service.',
15, 1000.00),
('Luxury',
'The Luxury Package provides a complete, high-end funeral service with exclusive benefits and premium amenities. It includes luxury transportation, top-tier coffin selections, and comprehensive event coordination. This package ensures a memorable and distinguished farewell for loved ones.',
20, 1500.00);

INSERT INTO storage (unitNumber, isAvailable)
VALUES
('S01',1),('S02',1),('S03',1),('S04',1),('S05',1),
('S06',1),('S07',1),('S08',1),('S09',1),('S10',1),
('S11',1),('S12',1),('S13',1),('S14',1),('S15',0),
('S16',0),('S17',0),('S18',0),('S19',0),('S20',0);

INSERT INTO bookingrestriction (maxDailyEvents, minAdvanceBookingDays, eventStartTime, eventEndTime)
VALUES
(10, 2, '08:00:00', '18:00:00');

INSERT INTO blackoutdate (blackoutDate, reason)
VALUES
('2026-12-25','Christmas Day'),
('2026-01-01','New Year'),
('2026-04-10','Public Holiday'),
('2026-08-09','Maintenance Closure'),
('2026-12-31','Year End Shutdown');

INSERT INTO user (fullName, IDNumber, cellNo, address, email, passwordHashed, dateCreated, isActive)
VALUES
('Thabo Mokoena', '9001015009087', '0810000001', '12 Main Street, Johannesburg', 'thabo.mokoena@legacycare.co.za', 'pass123', '08:00:00', 1),
('Lerato Dlamini', '9001015009088', '0810000002', '45 Vilakazi Street, Soweto', 'lerato.dlamini@legacycare.co.za', 'pass123', '08:00:00', 1),
('Sipho Nkosi', '9001015009089', '0810000003', '88 Church Street, Pretoria', 'sipho.nkosi@legacycare.co.za', 'pass123', '08:00:00', 1),
('Amogelang Khumalo', '9001015009090', '0810000004', '10 Rivonia Road, Sandton', 'amogelang.khumalo@legacycare.co.za', 'pass123', '08:00:00', 1),
('Naledi Molefe', '9001015009091', '0810000005', '5 Brand Road, Midrand', 'naledi.molefe@legacycare.co.za', 'pass123', '08:00:00', 1),

('Johannes van der Merwe', '9001015009092', '0810000006', '22 Park Lane, Pretoria East', 'johannes.vdm@legacycare.co.za', 'pass123', '08:00:00', 1),
('Zanele Ndlovu', '9001015009093', '0810000007', '14 Soweto Avenue, Soweto', 'zanele.ndlovu@legacycare.co.za', 'pass123', '08:00:00', 1),
('Pieter Botha', '9001015009094', '0810000008', '9 Sandton Drive, Sandton', 'pieter.botha@legacycare.co.za', 'pass123', '08:00:00', 1),
('Ayanda Mkhize', '9001015009095', '0810000009', '33 Orlando East, Soweto', 'ayanda.mkhize@legacycare.co.za', 'pass123', '08:00:00', 1),
('Reabetswe Sebola', '9001015009096', '0810000010', '18 Pretoria Central, Pretoria', 'reabetswe.sebola@legacycare.co.za', 'pass123', '08:00:00', 1),

('David Williams', '9001015009097', '0810000011', '77 Sandton City, Sandton', 'david.williams@legacycare.co.za', 'pass123', '08:00:00', 1),
('Thandiwe Zulu', '9001015009098', '0810000012', '11 Umlazi Road, Johannesburg', 'thandiwe.zulu@legacycare.co.za', 'pass123', '08:00:00', 1),
('Kagiso Motsoeneng', '9001015009099', '0810000013', '6 Centurion Drive, Pretoria', 'kagiso.motsoeneng@legacycare.co.za', 'pass123', '08:00:00', 1),
('Nicole Adams', '9001015009100', '0810000014', '2 Rosebank Avenue, Johannesburg', 'nicole.adams@legacycare.co.za', 'pass123', '08:00:00', 1),
('Mpho Ramaphosa', '9001015009101', '0810000015', '50 Midrand Heights, Midrand', 'mpho.ramaphosa@legacycare.co.za', 'pass123', '08:00:00', 1),

('Brian Smith', '9001015009102', '0810000016', '14 Bryanston Road, Sandton', 'brian.smith@legacycare.co.za', 'pass123', '08:00:00', 1),
('Puleng Modise', '9001015009103', '0810000017', '7 Kliptown Street, Soweto', 'puleng.modise@legacycare.co.za', 'pass123', '08:00:00', 1),
('Jabulani Dube', '9001015009104', '0810000018', '21 Pretoria North, Pretoria', 'jabulani.dube@legacycare.co.za', 'pass123', '08:00:00', 1),
('Emma Johnson', '9001015009105', '0810000019', '3 Melrose Arch, Johannesburg', 'emma.johnson@legacycare.co.za', 'pass123', '08:00:00', 1),
('Neo Tshabalala', '9001015009106', '0810000020', '19 Alexandra Township, Johannesburg', 'neo.tshabalala@legacycare.co.za', 'pass123', '08:00:00', 1),

('Sibongile Nene', '9001015009107', '0810000021', '12 Diepsloot, Johannesburg', 'sibongile.nene@legacycare.co.za', 'pass123', '08:00:00', 1),
('Michael Brown', '9001015009108', '0810000022', '8 Centurion Lake, Pretoria', 'michael.brown@legacycare.co.za', 'pass123', '08:00:00', 1),
('Lindiwe Khosa', '9001015009109', '0810000023', '4 Soweto West, Soweto', 'lindiwe.khosa@legacycare.co.za', 'pass123', '08:00:00', 1),
('Ethan Clark', '9001015009110', '0810000024', '17 Fourways, Johannesburg', 'ethan.clark@legacycare.co.za', 'pass123', '08:00:00', 1),
('Nomvula Dlamini', '9001015009111', '0810000025', '6 Pretoria Gardens, Pretoria', 'nomvula.dlamini@legacycare.co.za', 'pass123', '08:00:00', 1),

('Luke Johnson', '9001015009112', '0810000026', '9 Sandton CBD, Sandton', 'luke.johnson@legacycare.co.za', 'pass123', '08:00:00', 1),
('Grace Ndlovu', '9001015009113', '0810000027', '13 Soweto South, Soweto', 'grace.ndlovu@legacycare.co.za', 'pass123', '08:00:00', 1),
('Tebogo Molefe', '9001015009114', '0810000028', '25 Pretoria East, Pretoria', 'tebogo.molefe@legacycare.co.za', 'pass123', '08:00:00', 1),
('Sarah Williams', '9001015009115', '0810000029', '2 Johannesburg North, Johannesburg', 'sarah.williams@legacycare.co.za', 'pass123', '08:00:00', 1),
('Karabo Maseko', '9001015009116', '0810000030', '16 Midrand Central, Midrand', 'karabo.maseko@legacycare.co.za', 'pass123', '08:00:00', 1),

('Daniel Smith', '9001015009117', '0810000031', '11 Sandton West, Sandton', 'daniel.smith@legacycare.co.za', 'pass123', '08:00:00', 1),
('Amanda Jacobs', '9001015009118', '0810000032', '5 Pretoria West, Pretoria', 'amanda.jacobs@legacycare.co.za', 'pass123', '08:00:00', 1),
('Tshepo Mokoena', '9001015009119', '0810000033', '30 Soweto Central, Soweto', 'tshepo.mokoena@legacycare.co.za', 'pass123', '08:00:00', 1),
('Hannah White', '9001015009120', '0810000034', '7 Rosebank, Johannesburg', 'hannah.white@legacycare.co.za', 'pass123', '08:00:00', 1),
('Bongani Sithole', '9001015009121', '0810000035', '20 Pretoria CBD, Pretoria', 'bongani.sithole@legacycare.co.za', 'pass123', '08:00:00', 1);

INSERT INTO user (fullName, IDNumber, cellNo, address, email, passwordHashed, dateCreated, isActive)
VALUES
('Dineo Mashego', '9001015009122', '0810000036', '15 Fourways Gardens, Johannesburg', 'dineo.mashego@legacycare.co.za', 'pass123', '08:00:00', 1),
('Chris van Wyk', '9001015009123', '0810000037', '9 Pretoria North Ext, Pretoria', 'chris.vanwyk@legacycare.co.za', 'pass123', '08:00:00', 1),
('Refilwe Maseko', '9001015009124', '0810000038', '22 Soweto East, Soweto', 'refilwe.maseko@legacycare.co.za', 'pass123', '08:00:00', 1),
('Jordan Adams', '9001015009125', '0810000039', '3 Rosebank Heights, Johannesburg', 'jordan.adams@legacycare.co.za', 'pass123', '08:00:00', 1),
('Lethabo Nkuna', '9001015009126', '0810000040', '18 Midrand Central Park, Midrand', 'lethabo.nkuna@legacycare.co.za', 'pass123', '08:00:00', 1);

SELECT * FROM category;
SELECT * FROM user;
SELECT * FROM role;
SELECT * FROM package;
SELECT * FROM storage;
SELECT * FROM branch;
SELECT * FROM bookingrestriction;
SELECT * FROM blackoutdate;