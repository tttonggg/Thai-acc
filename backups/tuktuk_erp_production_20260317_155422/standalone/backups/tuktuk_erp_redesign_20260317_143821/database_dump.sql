PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "taxId" TEXT,
    "branchCode" TEXT,
    "address" TEXT,
    "subDistrict" TEXT,
    "district" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "fiscalYearStart" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO Company VALUES('company-1','บริษัท ไทย แอคเคานติ้ง จำกัด','Thai Accounting Co., Ltd.','0123456789012','00000','123 ถนนสุขุมวิท แขวงคลองตัน','คลองตัน','วัฒนา','กรุงเทพมหานคร','10110','02-123-4567','02-123-4568','info@thaiaccounting.com','www.thaiaccounting.com',NULL,1,NULL,1773336539824,1773336539824);
CREATE TABLE IF NOT EXISTS "ChartOfAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "type" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "isDetail" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChartOfAccount_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ChartOfAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO ChartOfAccount VALUES('cmmnqsflf000403ypd8mk3fp3','1000','สินทรัพย์',NULL,'ASSET',1,NULL,0,1,1,NULL,1773336540148,1773501436889);
INSERT INTO ChartOfAccount VALUES('cmmnqsflh000503ypwz0lmjo2','1100','สินทรัพย์หมุนเวียน',NULL,'ASSET',2,'cmmnqsflf000403ypd8mk3fp3',0,1,1,NULL,1773336540150,1773501436964);
INSERT INTO ChartOfAccount VALUES('cmmnqsfli000603ypggnor9wa','1110','เงินสดและเงินฝากธนาคาร',NULL,'ASSET',3,'cmmnqsflh000503ypwz0lmjo2',0,1,1,NULL,1773336540150,1773501436967);
INSERT INTO ChartOfAccount VALUES('cmmnqsfli000703ypxj4n8ug0','1111','เงินสด - ธนาคารกรุงเทพ',NULL,'ASSET',4,'cmmnqsfli000603ypggnor9wa',1,1,1,NULL,1773336540151,1773501436968);
INSERT INTO ChartOfAccount VALUES('cmmnqsflj000803ypcmniun24','1112','เงินสด - ธนาคารกสิกรไทย',NULL,'ASSET',4,'cmmnqsfli000603ypggnor9wa',1,1,1,NULL,1773336540152,1773501436971);
INSERT INTO ChartOfAccount VALUES('cmmnqsflk000903ypwink1s8o','1113','เงินสด - เงินสดย่อย',NULL,'ASSET',4,'cmmnqsfli000603ypggnor9wa',1,1,1,NULL,1773336540152,1773501436972);
INSERT INTO ChartOfAccount VALUES('cmmnqsflk000a03ypq6hnsew6','1120','ลูกหนี้การค้า',NULL,'ASSET',3,'cmmnqsflh000503ypwz0lmjo2',0,1,1,NULL,1773336540153,1773501436972);
INSERT INTO ChartOfAccount VALUES('cmmnqsfll000b03ypvp5zkd9k','1121','ลูกหนี้การค้า',NULL,'ASSET',4,'cmmnqsflk000a03ypq6hnsew6',1,1,1,NULL,1773336540153,1773501436973);
INSERT INTO ChartOfAccount VALUES('cmmnqsfll000c03ypskc3x6it','1122','สำรองค่าเสื่อมราคาลูกหนี้',NULL,'ASSET',4,'cmmnqsflk000a03ypq6hnsew6',1,1,1,NULL,1773336540154,1773501436974);
INSERT INTO ChartOfAccount VALUES('cmmnqsflm000d03yp6rgx8gvs','1130','ลูกหนี้อื่น',NULL,'ASSET',3,'cmmnqsflh000503ypwz0lmjo2',0,1,1,NULL,1773336540154,1773501436975);
INSERT INTO ChartOfAccount VALUES('cmmnqsfln000e03yp74wkjvpi','1131','เงินมัดจำ',NULL,'ASSET',4,'cmmnqsflm000d03yp6rgx8gvs',1,1,1,NULL,1773336540155,1773501436976);
INSERT INTO ChartOfAccount VALUES('cmmnqsfln000f03yp063lsk4d','1132','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',NULL,'ASSET',4,'cmmnqsflm000d03yp6rgx8gvs',1,1,1,NULL,1773336540156,1773501436977);
INSERT INTO ChartOfAccount VALUES('cmmnqsflo000g03ypli7mdf73','1140','สินค้าคงเหลือ',NULL,'ASSET',3,'cmmnqsflh000503ypwz0lmjo2',1,1,1,NULL,1773336540156,1773501436978);
INSERT INTO ChartOfAccount VALUES('cmmnqsflo000h03ypfc04m9ff','1150','ค่าใช้จ่ายจ่ายล่วงหน้า',NULL,'ASSET',3,'cmmnqsflh000503ypwz0lmjo2',1,1,1,NULL,1773336540157,1773501436979);
INSERT INTO ChartOfAccount VALUES('cmmnqsflp000i03yp8c4wd7bl','1200','สินทรัพย์ไม่หมุนเวียน',NULL,'ASSET',2,'cmmnqsflf000403ypd8mk3fp3',0,1,1,NULL,1773336540157,1773501436979);
INSERT INTO ChartOfAccount VALUES('cmmnqsflp000j03ypggfwrf28','1210','ที่ดิน อาคารและอุปกรณ์',NULL,'ASSET',3,'cmmnqsflp000i03yp8c4wd7bl',0,1,1,NULL,1773336540158,1773501436981);
INSERT INTO ChartOfAccount VALUES('cmmnqsflq000k03ypwlvj31j0','1211','ที่ดิน',NULL,'ASSET',4,'cmmnqsflp000j03ypggfwrf28',1,1,1,NULL,1773336540158,1773501436982);
INSERT INTO ChartOfAccount VALUES('cmmnqsflq000l03ypgv9rhm1o','1212','อาคาร',NULL,'ASSET',4,'cmmnqsflp000j03ypggfwrf28',1,1,1,NULL,1773336540159,1773501436983);
INSERT INTO ChartOfAccount VALUES('cmmnqsflr000m03yp88g9exdv','1213','ค่าเสื่อมราคาอาคารสะสม',NULL,'ASSET',4,'cmmnqsflp000j03ypggfwrf28',1,1,1,NULL,1773336540159,1773501436983);
INSERT INTO ChartOfAccount VALUES('cmmnqsflr000n03yp0x5fdgxt','1214','เครื่องจักรและอุปกรณ์',NULL,'ASSET',4,'cmmnqsflp000j03ypggfwrf28',1,1,1,NULL,1773336540160,1773501436984);
INSERT INTO ChartOfAccount VALUES('cmmnqsfls000o03ypvcu6ttwt','1215','ค่าเสื่อมราคาเครื่องจักรสะสม',NULL,'ASSET',4,'cmmnqsflp000j03ypggfwrf28',1,1,1,NULL,1773336540160,1773501436985);
INSERT INTO ChartOfAccount VALUES('cmmnqsfls000p03ypetjkakt6','1220','สินทรัพย์ไม่มีตัวตน',NULL,'ASSET',3,'cmmnqsflp000i03yp8c4wd7bl',1,1,1,NULL,1773336540161,1773501436986);
INSERT INTO ChartOfAccount VALUES('cmmnqsflt000q03ypla6qibni','2000','หนี้สิน',NULL,'LIABILITY',1,NULL,0,1,1,NULL,1773336540161,1773501436904);
INSERT INTO ChartOfAccount VALUES('cmmnqsflu000r03ypa07spqwz','2100','หนี้สินหมุนเวียน',NULL,'LIABILITY',2,'cmmnqsflt000q03ypla6qibni',0,1,1,NULL,1773336540162,1773501436987);
INSERT INTO ChartOfAccount VALUES('cmmnqsflu000s03yphef7yzb3','2110','เจ้าหนี้การค้า',NULL,'LIABILITY',3,'cmmnqsflu000r03ypa07spqwz',1,1,1,NULL,1773336540163,1773501436988);
INSERT INTO ChartOfAccount VALUES('cmmnqsflv000t03yp17rjb5ss','2120','ตั๋วเงินจ่าย',NULL,'LIABILITY',3,'cmmnqsflu000r03ypa07spqwz',1,1,1,NULL,1773336540163,1773501436988);
INSERT INTO ChartOfAccount VALUES('cmmnqsflv000u03ypq5dvti5k','2130','เจ้าหนี้อื่น',NULL,'LIABILITY',3,'cmmnqsflu000r03ypa07spqwz',0,1,1,NULL,1773336540164,1773501436989);
INSERT INTO ChartOfAccount VALUES('cmmnqsflw000v03ypgosemifi','2131','ภาษีเงินได้หัก ณ ที่จ่าย',NULL,'LIABILITY',4,'cmmnqsflv000u03ypq5dvti5k',1,1,1,NULL,1773336540164,1773501436990);
INSERT INTO ChartOfAccount VALUES('cmmnqsflw000w03yp6ra94tlx','2132','ภาษีมูลค่าเพิ่มต้องชำระ',NULL,'LIABILITY',4,'cmmnqsflv000u03ypq5dvti5k',1,1,1,NULL,1773336540165,1773501436991);
INSERT INTO ChartOfAccount VALUES('cmmnqsflx000x03ypd22msqop','2133','ประกันสังคมต้องจ่าย',NULL,'LIABILITY',4,'cmmnqsflv000u03ypq5dvti5k',1,1,1,NULL,1773336540166,1773501436991);
INSERT INTO ChartOfAccount VALUES('cmmnqsfly000y03yp6zoaavp1','2140','เงินเดือนต้องจ่าย',NULL,'LIABILITY',3,'cmmnqsflu000r03ypa07spqwz',1,1,1,NULL,1773336540166,1773501436992);
INSERT INTO ChartOfAccount VALUES('cmmnqsfly000z03ypowwkibbc','2150','ภาษีเงินได้นิติบุคคลต้องชำระ',NULL,'LIABILITY',3,'cmmnqsflu000r03ypa07spqwz',1,1,1,NULL,1773336540167,1773501436993);
INSERT INTO ChartOfAccount VALUES('cmmnqsflz001003ypadkoslgf','2200','หนี้สินไม่หมุนเวียน',NULL,'LIABILITY',2,'cmmnqsflt000q03ypla6qibni',0,1,1,NULL,1773336540167,1773501436993);
INSERT INTO ChartOfAccount VALUES('cmmnqsflz001103ypqkgb8nl9','2210','เงินกู้ยืมระยะยาว',NULL,'LIABILITY',3,'cmmnqsflz001003ypadkoslgf',1,1,1,NULL,1773336540168,1773501436995);
INSERT INTO ChartOfAccount VALUES('cmmnqsfm0001203yps6xmbpif','3000','ส่วนของผู้ถือหุ้น',NULL,'EQUITY',1,NULL,0,1,1,NULL,1773336540168,1773501436913);
INSERT INTO ChartOfAccount VALUES('cmmnqsfm1001303ypthsc896w','3100','ทุนจดทะเบียน',NULL,'EQUITY',2,'cmmnqsfm0001203yps6xmbpif',0,1,1,NULL,1773336540169,1773501436996);
INSERT INTO ChartOfAccount VALUES('cmmnqsfm2001403yp204i6v7g','3110','ทุนจดทะเบียนสามัญ',NULL,'EQUITY',3,'cmmnqsfm1001303ypthsc896w',1,1,1,NULL,1773336540170,1773501436998);
INSERT INTO ChartOfAccount VALUES('cmmnqsfm2001503ypjf0ruhut','3200','ทุนเกินมูลค่าหุ้น',NULL,'EQUITY',2,'cmmnqsfm0001203yps6xmbpif',1,1,1,NULL,1773336540171,1773501437000);
INSERT INTO ChartOfAccount VALUES('cmmnqsfm3001603yp2rngne6c','3300','กำไร(ขาดทุน)สะสม',NULL,'EQUITY',2,'cmmnqsfm0001203yps6xmbpif',1,1,1,NULL,1773336540171,1773501437004);
INSERT INTO ChartOfAccount VALUES('cmmnqsfm3001703ypjyvf6ozx','3400','งวดบัญชี',NULL,'EQUITY',2,'cmmnqsfm0001203yps6xmbpif',0,1,1,NULL,1773336540172,1773501437004);
INSERT INTO ChartOfAccount VALUES('cmmnqsfm4001803ypbkr7myq8','3410','งวดบัญชีเจ้าหนี้',NULL,'EQUITY',3,'cmmnqsfm3001703ypjyvf6ozx',1,1,1,NULL,1773336540172,1773501437006);
INSERT INTO ChartOfAccount VALUES('cmmnqsfm4001903yp8kk5ng4x','4000','รายได้',NULL,'REVENUE',1,NULL,0,1,1,NULL,1773336540173,1773501436919);
INSERT INTO ChartOfAccount VALUES('cmmnqsfm5001a03ypjkg7gmsm','4100','รายได้จากการขาย',NULL,'REVENUE',2,'cmmnqsfm4001903yp8kk5ng4x',0,1,1,NULL,1773336540174,1773501437007);
INSERT INTO ChartOfAccount VALUES('cmmnqsfm6001b03yp4pev8m1a','4110','รายได้จากการขายสินค้า',NULL,'REVENUE',3,'cmmnqsfm5001a03ypjkg7gmsm',1,1,1,NULL,1773336540174,1773501437008);
INSERT INTO ChartOfAccount VALUES('cmmnqsfm6001c03ypqq97da2d','4120','รายได้จากการให้บริการ',NULL,'REVENUE',3,'cmmnqsfm5001a03ypjkg7gmsm',1,1,1,NULL,1773336540175,1773501437010);
INSERT INTO ChartOfAccount VALUES('cmmnqsfm7001d03yp1mwyq6iu','4130','ส่วนลดให้แก่ลูกค้า',NULL,'REVENUE',3,'cmmnqsfm5001a03ypjkg7gmsm',1,1,1,NULL,1773336540175,1773501437011);
INSERT INTO ChartOfAccount VALUES('cmmnqsfm7001e03yp92gog76f','4200','รายได้อื่น',NULL,'REVENUE',2,'cmmnqsfm4001903yp8kk5ng4x',0,1,1,NULL,1773336540176,1773501437011);
INSERT INTO ChartOfAccount VALUES('cmmnqsfm8001f03yppgrlcmrl','4210','ดอกเบี้ยรับ',NULL,'REVENUE',3,'cmmnqsfm7001e03yp92gog76f',1,1,1,NULL,1773336540177,1773501437013);
INSERT INTO ChartOfAccount VALUES('cmmnqsfm9001g03ypfopbxbeo','4220','รายได้ค่าเช่า',NULL,'REVENUE',3,'cmmnqsfm7001e03yp92gog76f',1,1,1,NULL,1773336540177,1773501437013);
INSERT INTO ChartOfAccount VALUES('cmmnqsfm9001h03yp4e60h55f','4230','รายได้จากการจำหน่ายสินทรัพย์',NULL,'REVENUE',3,'cmmnqsfm7001e03yp92gog76f',1,1,1,NULL,1773336540178,1773501437014);
INSERT INTO ChartOfAccount VALUES('cmmnqsfma001i03ypy8k7tojt','5000','ค่าใช้จ่าย',NULL,'EXPENSE',1,NULL,0,1,1,NULL,1773336540178,1773501436928);
INSERT INTO ChartOfAccount VALUES('cmmnqsfma001j03yppyezgvab','5100','ต้นทุนขาย',NULL,'EXPENSE',2,'cmmnqsfma001i03ypy8k7tojt',0,1,1,NULL,1773336540179,1773501437015);
INSERT INTO ChartOfAccount VALUES('cmmnqsfmb001k03ypdt8450eg','5110','ต้นทุนสินค้าขาย',NULL,'EXPENSE',3,'cmmnqsfma001j03yppyezgvab',1,1,1,NULL,1773336540179,1773501437016);
INSERT INTO ChartOfAccount VALUES('cmmnqsfmc001l03yptegadcdm','5200','ค่าใช้จ่ายในการขาย',NULL,'EXPENSE',2,'cmmnqsfma001i03ypy8k7tojt',0,1,1,NULL,1773336540180,1773501437017);
INSERT INTO ChartOfAccount VALUES('cmmnqsfmc001m03yp6w0zh0tt','5210','ค่าโฆษณา',NULL,'EXPENSE',3,'cmmnqsfmc001l03yptegadcdm',1,1,1,NULL,1773336540181,1773501437019);
INSERT INTO ChartOfAccount VALUES('cmmnqsfmd001n03yplrjtcldz','5220','ค่าเดินทาง',NULL,'EXPENSE',3,'cmmnqsfmc001l03yptegadcdm',1,1,1,NULL,1773336540181,1773501437019);
INSERT INTO ChartOfAccount VALUES('cmmnqsfmd001o03yp4cazx1cg','5230','ค่านายหน้า',NULL,'EXPENSE',3,'cmmnqsfmc001l03yptegadcdm',1,1,1,NULL,1773336540182,1773501437021);
INSERT INTO ChartOfAccount VALUES('cmmnqsfme001p03yppbuu59wi','5300','ค่าใช้จ่ายในการบริหาร',NULL,'EXPENSE',2,'cmmnqsfma001i03ypy8k7tojt',0,1,1,NULL,1773336540182,1773501437022);
INSERT INTO ChartOfAccount VALUES('cmmnqsfme001q03ypqqsp56c3','5310','เงินเดือนและค่าจ้าง',NULL,'EXPENSE',3,'cmmnqsfme001p03yppbuu59wi',1,1,1,NULL,1773336540183,1773501437023);
INSERT INTO ChartOfAccount VALUES('cmmnqsfmf001r03yp9c0dzgyh','5320','ค่าเช่าอาคาร',NULL,'EXPENSE',3,'cmmnqsfme001p03yppbuu59wi',1,1,1,NULL,1773336540183,1773501437023);
INSERT INTO ChartOfAccount VALUES('cmmnqsfmg001s03ypt02h6f34','5330','ค่าน้ำประปา',NULL,'EXPENSE',3,'cmmnqsfme001p03yppbuu59wi',1,1,1,NULL,1773336540184,1773501437025);
INSERT INTO ChartOfAccount VALUES('cmmnqsfmg001t03ypc7k8q9b0','5340','ค่าไฟฟ้า',NULL,'EXPENSE',3,'cmmnqsfme001p03yppbuu59wi',1,1,1,NULL,1773336540185,1773501437026);
INSERT INTO ChartOfAccount VALUES('cmmnqsfmh001u03ypcw4k8tfy','5350','ค่าโทรศัพท์และอินเทอร์เน็ต',NULL,'EXPENSE',3,'cmmnqsfme001p03yppbuu59wi',1,1,1,NULL,1773336540185,1773501437026);
INSERT INTO ChartOfAccount VALUES('cmmnqsfmi001v03ypohi8sxo0','5360','ค่าซ่อมแซมและบำรุงรักษา',NULL,'EXPENSE',3,'cmmnqsfme001p03yppbuu59wi',1,1,1,NULL,1773336540186,1773501437028);
INSERT INTO ChartOfAccount VALUES('cmmnqsfmi001w03ypmqh9t2t2','5370','ค่าขนส่ง',NULL,'EXPENSE',3,'cmmnqsfme001p03yppbuu59wi',1,1,1,NULL,1773336540187,1773501437028);
INSERT INTO ChartOfAccount VALUES('cmmnqsfmj001x03ypgg6k59jl','5380','ค่าใช้จ่ายเบ็ดเตล็ด',NULL,'EXPENSE',3,'cmmnqsfme001p03yppbuu59wi',1,1,1,NULL,1773336540187,1773501437029);
INSERT INTO ChartOfAccount VALUES('cmmnqsfmj001y03yprezzs8ut','5390','ค่าเสื่อมราคา',NULL,'EXPENSE',3,'cmmnqsfme001p03yppbuu59wi',1,1,1,NULL,1773336540188,1773501437031);
INSERT INTO ChartOfAccount VALUES('cmmnqsfmk001z03ypcx3gmere','5400','ค่าใช้จ่ายทางการเงิน',NULL,'EXPENSE',2,'cmmnqsfma001i03ypy8k7tojt',0,1,1,NULL,1773336540188,1773501437033);
INSERT INTO ChartOfAccount VALUES('cmmnqsfmk002003yp0e1jq3h6','5410','ดอกเบี้ยจ่าย',NULL,'EXPENSE',3,'cmmnqsfmk001z03ypcx3gmere',1,1,1,NULL,1773336540189,1773501437035);
INSERT INTO ChartOfAccount VALUES('cmmnqsfml002103ypqyo9cq6w','5420','ค่าธรรมเนียมธนาคาร',NULL,'EXPENSE',3,'cmmnqsfmk001z03ypcx3gmere',1,1,1,NULL,1773336540189,1773501437036);
INSERT INTO ChartOfAccount VALUES('cmmnqsfml002203ypeqvcv65x','5500','ภาษีและส่วนสมทบ',NULL,'EXPENSE',2,'cmmnqsfma001i03ypy8k7tojt',0,1,1,NULL,1773336540190,1773501437037);
INSERT INTO ChartOfAccount VALUES('cmmnqsfmm002303ypnj2y68dn','5510','ภาษีเงินได้นิติบุคคล',NULL,'EXPENSE',3,'cmmnqsfml002203ypeqvcv65x',1,1,1,NULL,1773336540191,1773501437037);
INSERT INTO ChartOfAccount VALUES('cmmnqsfmn002403yprzda3epg','5520','ภาษีธุรกิจเฉพาะ',NULL,'EXPENSE',3,'cmmnqsfml002203ypeqvcv65x',1,1,1,NULL,1773336540191,1773501437038);
CREATE TABLE IF NOT EXISTS "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "taxId" TEXT,
    "branchCode" TEXT,
    "address" TEXT,
    "subDistrict" TEXT,
    "district" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "website" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankAccountName" TEXT,
    "creditDays" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "externalRefId" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
, "deletedAt" DATETIME, "deletedBy" TEXT);
INSERT INTO Vendor VALUES('cmmnqsfnz002h03ypn9x6iqfd','V001','บริษัท ซัพพลายเออร์ จำกัด',NULL,'0105555111222',NULL,NULL,NULL,NULL,'กรุงเทพมหานคร',NULL,'02-777-8888',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,30,1,NULL,NULL,NULL,1773336540240,1773336540240,NULL,NULL);
INSERT INTO Vendor VALUES('cmmnqsfo0002i03ypge0zxns1','V002','บริษัท โลจิสติกส์ไทย จำกัด',NULL,'0105555333444',NULL,NULL,NULL,NULL,'กรุงเทพมหานคร',NULL,'02-999-0000',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,30,1,NULL,NULL,NULL,1773336540241,1773336540241,NULL,NULL);
INSERT INTO Vendor VALUES('cmmnqsfop003703ypwb2aavgm','V003','บริษัท ซัพพลายเออร์ เอเชีย จำกัด',NULL,'0105556789012',NULL,'789 ถนนพระราม 2 เขตบางขุนเทียน กรุงเทพฯ 10150',NULL,NULL,'กรุงเทพมหานคร',NULL,'02-111-3333',NULL,'sales@asiasupplier.co.th',NULL,'วุฒิ ผู้ใหญ่',NULL,'ธนาคารกรุงเทพ','123-4-56789-0','บจก. ซัพพลายเออร์ เอเชีย',30,1,NULL,NULL,NULL,1773336540266,1773336540266,NULL,NULL);
INSERT INTO Vendor VALUES('cmmnqsfoq003803ypswrsymfw','V004','บริษัท โลจิสติกส์ ดีลิเวอรี่ จำกัด',NULL,'0105557890123',NULL,'456 ถนนกัลปพฤกษ์ เขตตลิ่งชัน กรุงเทพฯ 10170',NULL,NULL,'กรุงเทพมหานคร',NULL,'02-222-4444',NULL,'logistics@delivery.co.th',NULL,'ส่ง ไว',NULL,'ธนาคารกสิกรไทย','234-5-67890-1','บจก. โลจิสติกส์ ดีลิเวอรี่',45,1,NULL,NULL,NULL,1773336540267,1773336540267,NULL,NULL);
INSERT INTO Vendor VALUES('cmmnqsfor003903yp76p2th72','V005','บริษัท เทคโน ซัพพลาย จำกัด',NULL,'0105558901234',NULL,'123 ถนนพหลโยธิน เขตจตุจักร กรุงเทพฯ 10900',NULL,NULL,'กรุงเทพมหานคร',NULL,'02-333-5555',NULL,'tech@technosupply.co.th',NULL,'เทค โนโลยี',NULL,'ธนาคารไทยพาณิชย์','345-6-78901-2','บจก. เทคโน ซัพพลาย',30,1,NULL,NULL,NULL,1773336540268,1773336540268,NULL,NULL);
INSERT INTO Vendor VALUES('cmmnqsfos003a03ypah25ex02','V006','บริษัท ออฟฟิศ แมททีเรียล จำกัด',NULL,'0105559012345',NULL,'258 ถนนลาดพร้าว เขตลาดพร้าว กรุงเทพฯ 10230',NULL,NULL,'กรุงเทพมหานคร',NULL,'02-444-6666',NULL,'office@officemat.co.th',NULL,'สำนักงาน เรียบร้อย',NULL,'ธนาคารกรุงเทพ','456-7-89012-3','บจก. ออฟฟิศ แมททีเรียล',30,1,NULL,NULL,NULL,1773336540268,1773336540268,NULL,NULL);
INSERT INTO Vendor VALUES('cmmnqsfot003b03yprptgdoll','V007','บริษัท พลังงาน ไทย จำกัด',NULL,'0105550123456',NULL,'963 ถนนนราธิวาสราชนครินทร์ เขตทุ่งครุ กรุงเทพฯ 10140',NULL,NULL,'กรุงเทพมหานคร',NULL,'02-555-7777',NULL,'energy@thaipower.co.th',NULL,'ไฟฟ้า ส่องสว่าง',NULL,'ธนาคารกรุงไทย','567-8-90123-4','บจก. พลังงาน ไทย',30,1,NULL,NULL,NULL,1773336540269,1773336540269,NULL,NULL);
INSERT INTO Vendor VALUES('cmmnqsfot003c03yp4xqk5ul9','V008','ห้างหุ้นส่วนจำกัด น้ำมัน หอมระยอง',NULL,'0205551234567',NULL,'741 อำเภอเมือง จังหวัดระยอง 21000',NULL,NULL,'ระยอง',NULL,'038-444-5555',NULL,'oil@rayong.co.th',NULL,'น้ำมัน ดี',NULL,'ธนาคารกรุงเทพ','678-9-01234-5','หจก. น้ำมัน หอม',45,1,NULL,NULL,NULL,1773336540270,1773336540270,NULL,NULL);
INSERT INTO Vendor VALUES('cmmnqsfou003d03ypr4cx7fnw','V009','บริษัท ฮาร์ดแวร์ โปร จำกัด',NULL,'0505552345678',NULL,'852 ถนนนิมมานรดี อำเภอเมือง จังหวัดเชียงใหม่ 50000',NULL,NULL,'เชียงใหม่',NULL,'053-444-6666',NULL,'hardware@hardwarepro.co.th',NULL,'เหล็ก แข็งแรง',NULL,'ธนาคารกรุงเทพ','789-0-12345-6','บจก. ฮาร์ดแวร์ โปร',30,1,NULL,NULL,NULL,1773336540271,1773336540271,NULL,NULL);
INSERT INTO Vendor VALUES('cmmnqsfov003e03ypy01oa3wt','V010','บริษัท อิเล็กทรอนิกส์ พาร์ท จำกัด',NULL,'0405553456789',NULL,'159 อำเภอเมือง จังหวัดขอนแก่น 40000',NULL,NULL,'ขอนแก่น',NULL,'043-555-7777',NULL,'parts@electronicparts.co.th',NULL,'วงจร ไฟฟ้า',NULL,'ธนาคารกสิกรไทย','890-1-23456-7','บจก. อิเล็กทรอนิกส์ พาร์ท',30,1,NULL,NULL,NULL,1773336540271,1773336540271,NULL,NULL);
CREATE TABLE IF NOT EXISTS "FinancialReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "DocumentNumber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "currentNo" INTEGER NOT NULL DEFAULT 0,
    "format" TEXT NOT NULL DEFAULT '{prefix}{yyyy}{mm}-{0000}',
    "resetMonthly" BOOLEAN NOT NULL DEFAULT true,
    "resetYearly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO DocumentNumber VALUES('cmmnqsfnq002503yphsxedumu','JOURNAL','JE',0,'{prefix}{yyyy}{mm}-{0000}',1,0,1773336540230,1773336540230);
INSERT INTO DocumentNumber VALUES('cmmnqsfnr002603ypw1v6tjxk','INVOICE','INV',0,'{prefix}{yyyy}{mm}-{0000}',1,0,1773336540231,1773336540231);
INSERT INTO DocumentNumber VALUES('cmmnqsfnr002703yp39lv7dco','RECEIPT','RC',0,'{prefix}{yyyy}{mm}-{0000}',1,0,1773336540232,1773336540232);
INSERT INTO DocumentNumber VALUES('cmmnqsfns002803yp9qzx3qfr','PAYMENT','PY',0,'{prefix}{yyyy}{mm}-{0000}',1,0,1773336540232,1773336540232);
INSERT INTO DocumentNumber VALUES('cmmnqsfns002903ypr3vh0swu','CREDIT_NOTE','CN',0,'{prefix}{yyyy}{mm}-{0000}',1,0,1773336540233,1773336540233);
INSERT INTO DocumentNumber VALUES('cmmnqsfnt002a03ypz39oglh7','DEBIT_NOTE','DN',0,'{prefix}{yyyy}{mm}-{0000}',1,0,1773336540233,1773336540233);
INSERT INTO DocumentNumber VALUES('cmmnqsfnt002b03ypzmiew635','PURCHASE','PO',0,'{prefix}{yyyy}{mm}-{0000}',1,0,1773336540234,1773336540234);
INSERT INTO DocumentNumber VALUES('cmmnqsfnu002c03yp8s6a6edj','WHT_CERT','WHT',0,'{prefix}{yyyy}{mm}-{0000}',1,0,1773336540234,1773336540234);
INSERT INTO DocumentNumber VALUES('cmmnqsfnv002d03ypko193p21','STOCK_TRANSFER','TRF',0,'{prefix}{yyyy}{mm}-{0000}',1,0,1773336540235,1773336540235);
INSERT INTO DocumentNumber VALUES('cmmoiurr90098rqbe56h3t754','invoice','INV',0,'{prefix}-{yyyy}-{mm}-{0000}',1,0,1773383678469,1773383678469);
INSERT INTO DocumentNumber VALUES('cmmoiurra0099rqbeazx9vomv','receipt','RCP',0,'{prefix}-{yyyy}-{mm}-{0000}',1,0,1773383678470,1773383678470);
INSERT INTO DocumentNumber VALUES('cmmoiurra009arqbe5xv31sug','payment','PAY',0,'{prefix}-{yyyy}-{mm}-{0000}',1,0,1773383678471,1773383678471);
INSERT INTO DocumentNumber VALUES('cmmoiurrb009brqbekknjumf4','journal','JE',0,'{prefix}-{yyyy}-{mm}-{0000}',1,0,1773383678471,1773383678471);
INSERT INTO DocumentNumber VALUES('cmmoiurrb009crqbehi4bkq1r','credit_note','CN',0,'{prefix}-{yyyy}-{mm}-{0000}',1,0,1773383678472,1773383678472);
INSERT INTO DocumentNumber VALUES('cmmoiurrc009drqbelxinfhja','debit_note','DN',0,'{prefix}-{yyyy}-{mm}-{0000}',1,0,1773383678472,1773383678472);
INSERT INTO DocumentNumber VALUES('cmmoiurrd009erqbeaqc4j8yy','purchase','PO',0,'{prefix}-{yyyy}-{mm}-{0000}',1,0,1773383678473,1773383678473);
INSERT INTO DocumentNumber VALUES('cmmoiurrd009frqbe8r5wfwuh','payroll','PAYROLL',0,'{prefix}-{yyyy}-{mm}-{000}',1,0,1773383678474,1773383678474);
INSERT INTO DocumentNumber VALUES('cmmoiurre009grqbe0svn5tvv','petty_cash','PCV',0,'{prefix}-{yyyy}-{mm}-{000}',1,0,1773383678474,1773383678474);
CREATE TABLE IF NOT EXISTS "ApiToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS "InventoryConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "stockMovementTrigger" TEXT NOT NULL DEFAULT 'ON_ISSUE',
    "enableMultiCurrency" BOOLEAN NOT NULL DEFAULT false,
    "defaultCostingMethod" TEXT NOT NULL DEFAULT 'WEIGHTED_AVERAGE',
    "defaultWarehouseId" TEXT,
    "autoCreateCOGSJournal" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Warehouse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MAIN',
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO Warehouse VALUES('cmmua0928009nrq6b7t5pvkys','MAIN','คลังสินค้าหลัก','MAIN','สำนักงานใหญ่',1,NULL,NULL,1773731614689,1773731614689);
CREATE TABLE IF NOT EXISTS "WarehouseZone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warehouseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WarehouseZone_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "StockTransfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transferNo" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "fromWarehouseId" TEXT NOT NULL,
    "toWarehouseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "requestedById" TEXT,
    "approvedById" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "StockTransferLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "notes" TEXT,
    CONSTRAINT "StockTransferLine_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockTransferLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "BankAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "glAccountId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "SystemSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "vatRate" REAL NOT NULL DEFAULT 7,
    "whtPnd53Service" REAL NOT NULL DEFAULT 3,
    "whtPnd53Rent" REAL NOT NULL DEFAULT 5,
    "whtPnd53Prof" REAL NOT NULL DEFAULT 3,
    "whtPnd53Contract" REAL NOT NULL DEFAULT 1,
    "whtPnd53Advert" REAL NOT NULL DEFAULT 2,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SystemSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO SystemSettings VALUES('cmmoiurre009irqbedsgod0i7','company-1',7.0,3.0,5.0,3.0,1.0,2.0,NULL,1773383678475,1773383678475);
CREATE TABLE IF NOT EXISTS "StockTake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stockTakeNumber" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "takeDate" DATETIME NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT,
    "approvedBy" TEXT,
    "approvedByName" TEXT,
    "approvedAt" DATETIME,
    "journalEntryId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StockTake_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockTake_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "DataImport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dataType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "totalRecords" INTEGER NOT NULL,
    "createdCount" INTEGER NOT NULL,
    "updatedCount" INTEGER NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "errorMessage" TEXT,
    "importedById" TEXT,
    "errorDetails" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DataImport_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "recordId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO ActivityLog VALUES('cmmtehb7q0002031lbuhkldeb','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773678662918);
INSERT INTO ActivityLog VALUES('cmmu37t3t0002rqmgalx87ee2','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720209945);
INSERT INTO ActivityLog VALUES('cmmu38y010007rqmgjfox9x61','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720262944);
INSERT INTO ActivityLog VALUES('cmmu38y040009rqmgb1id3d5d','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720262948);
INSERT INTO ActivityLog VALUES('cmmu38y11000brqmg70vs4daa','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720262981);
INSERT INTO ActivityLog VALUES('cmmu38y2g000erqmgnadcarja','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720263033);
INSERT INTO ActivityLog VALUES('cmmu39cm0000irqmgqt597oyg','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720281880);
INSERT INTO ActivityLog VALUES('cmmu39cmj000lrqmg4dmve173','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720281899);
INSERT INTO ActivityLog VALUES('cmmu39cnx000orqmg79b06aii','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720281950);
INSERT INTO ActivityLog VALUES('cmmu39crd000qrqmgzwv4iu36','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720282072);
INSERT INTO ActivityLog VALUES('cmmu39q6h000urqmgsxc6ocq0','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720299465);
INSERT INTO ActivityLog VALUES('cmmu39q6p000wrqmgfx1oeag7','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720299474);
INSERT INTO ActivityLog VALUES('cmmu39qa30010rqmgwg5too4p','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720299596);
INSERT INTO ActivityLog VALUES('cmmu39qal0012rqmgoqp1zzbt','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720299613);
INSERT INTO ActivityLog VALUES('cmmu39x3c0016rqmguxm9mpmj','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720308424);
INSERT INTO ActivityLog VALUES('cmmu39x3e0018rqmg4h3wepnl','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720308427);
INSERT INTO ActivityLog VALUES('cmmu39zto001brqmgid5doit0','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720311964);
INSERT INTO ActivityLog VALUES('cmmu3a026001erqmgf4ffh7uz','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720312270);
INSERT INTO ActivityLog VALUES('cmmu3awl2001hrqmgps37pwfx','cmmnqsfld000103yp3d86suci','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720354423);
INSERT INTO ActivityLog VALUES('cmmu3fvz9001krqmgm0xl8bcy','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773720586917);
INSERT INTO ActivityLog VALUES('cmmu3p22b0002rqzhor39726x','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773721014708);
INSERT INTO ActivityLog VALUES('cmmu3q1re0005rqzh0zftwab6','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773721060970);
INSERT INTO ActivityLog VALUES('cmmu3q46s0008rqzh9kl2xzs0','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773721064117);
INSERT INTO ActivityLog VALUES('cmmu3q8g6000brqzhz21gyo8t','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773721069639);
INSERT INTO ActivityLog VALUES('cmmu3rc4x000erqzhfaq1bgm1','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773721121074);
INSERT INTO ActivityLog VALUES('cmmu3td5q003xrqzh43z605hl','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773721215710);
INSERT INTO ActivityLog VALUES('cmmu3u2n30042rqzh2pygmpkn','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773721248735);
INSERT INTO ActivityLog VALUES('cmmu3z2s90002rqpn7sf58ilt','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773721482201);
INSERT INTO ActivityLog VALUES('cmmu3zck20007rqpns4y5patu','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773721494867);
INSERT INTO ActivityLog VALUES('cmmu427se000crqpnfrv2yskg','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773721628654);
INSERT INTO ActivityLog VALUES('cmmu476a50002rqeakayk7iur','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773721859981);
INSERT INTO ActivityLog VALUES('cmmu4dml70005rql1witbmfok','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722161052);
INSERT INTO ActivityLog VALUES('cmmu4dmlh0009rql1la9kovv0','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722161062);
INSERT INTO ActivityLog VALUES('cmmu4dmlp000drql1tqj6gsd3','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722161069);
INSERT INTO ActivityLog VALUES('cmmu4dmmk000hrql1ojl7k44n','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722161100);
INSERT INTO ActivityLog VALUES('cmmu4dyvw000nrql1ue4pl9j7','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722176989);
INSERT INTO ActivityLog VALUES('cmmu4dywk000prql1ifiabyrn','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722177013);
INSERT INTO ActivityLog VALUES('cmmu4dzak000wrql1di14su3i','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722177517);
INSERT INTO ActivityLog VALUES('cmmu4dzku0011rql14x9uyomr','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722177886);
INSERT INTO ActivityLog VALUES('cmmu4e4mt0016rql1f8t0m64w','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722184438);
INSERT INTO ActivityLog VALUES('cmmu4e4n3001brql1q9d6vusy','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722184448);
INSERT INTO ActivityLog VALUES('cmmu4e6ep001grql1pu61t275','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722186738);
INSERT INTO ActivityLog VALUES('cmmu4e6x7001lrql19a8cskmm','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722187404);
INSERT INTO ActivityLog VALUES('cmmu4ebr7001qrql1sma8ftcz','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722193667);
INSERT INTO ActivityLog VALUES('cmmu4ebro001vrql15jzhf1jn','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722193684);
INSERT INTO ActivityLog VALUES('cmmu4edno0020rql1m1sm8h6f','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722196132);
INSERT INTO ActivityLog VALUES('cmmu4ee3w0025rql1clynwyz3','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722196716);
INSERT INTO ActivityLog VALUES('cmmu4ev7p002brql1set5mao6','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722218882);
INSERT INTO ActivityLog VALUES('cmmu4ev84002drql1qpvgl1k1','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722218900);
INSERT INTO ActivityLog VALUES('cmmu4g3ai002mrql146r25j8y','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722276010);
INSERT INTO ActivityLog VALUES('cmmu4g3am002orql1yhqaxqbi','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722276015);
INSERT INTO ActivityLog VALUES('cmmu4g3bh002urql1ermhq274','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722276045);
INSERT INTO ActivityLog VALUES('cmmu4g3g5002zrql1btzeiz94','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722276213);
INSERT INTO ActivityLog VALUES('cmmu4g9s20034rql1d3kq9gjv','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722284419);
INSERT INTO ActivityLog VALUES('cmmu4ge130039rql13h9dhkz3','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722289927);
INSERT INTO ActivityLog VALUES('cmmu4gefg003erql1jn5cgpf1','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722290445);
INSERT INTO ActivityLog VALUES('cmmu4gfen003jrql1fi434787','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722291711);
INSERT INTO ActivityLog VALUES('cmmu4gh1c003orql1b2dfczjk','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722293824);
INSERT INTO ActivityLog VALUES('cmmu4gihc003trql1tg7e2ltf','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722295696);
INSERT INTO ActivityLog VALUES('cmmu4gluv003yrql1xrw4scpq','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722300072);
INSERT INTO ActivityLog VALUES('cmmu4gn7c0043rql1gcl0yi5u','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722301816);
INSERT INTO ActivityLog VALUES('cmmu4i0xd0048rql1p7k6hdom','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722366258);
INSERT INTO ActivityLog VALUES('cmmu4i1gk004drql1udfnuw8y','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722366949);
INSERT INTO ActivityLog VALUES('cmmu4i27h004irql1o3rbff3z','cmmnqsfld000103yp3d86suci','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722367918);
INSERT INTO ActivityLog VALUES('cmmu4i54o004nrql175rhq7ac','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722371705);
INSERT INTO ActivityLog VALUES('cmmu4iaj9004srql1cro3v7y2','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722378709);
INSERT INTO ActivityLog VALUES('cmmu4ifyy004xrql1lkcny9lz','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722385754);
INSERT INTO ActivityLog VALUES('cmmu4ileq0052rql1jkgz45yu','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722392803);
INSERT INTO ActivityLog VALUES('cmmu4iquh0057rql13kjc1glx','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722399850);
INSERT INTO ActivityLog VALUES('cmmu4iw9e005crql1m3xnmqo3','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722406866);
INSERT INTO ActivityLog VALUES('cmmu4j1wq005hrql1e6b149uc','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722414186);
INSERT INTO ActivityLog VALUES('cmmu4j7ol005mrql1rwzhph0e','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722421669);
INSERT INTO ActivityLog VALUES('cmmu4jl2b005rrql1qxaf8hfw','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722439011);
INSERT INTO ActivityLog VALUES('cmmu4jqg7005wrql1y9g95ufc','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722445992);
INSERT INTO ActivityLog VALUES('cmmu4jvu50061rql1qy2xiq9o','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722452974);
INSERT INTO ActivityLog VALUES('cmmu4k1gf0066rql13jwxraql','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722460256);
INSERT INTO ActivityLog VALUES('cmmu4k6xm006brql1ja3j3mtp','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722467354);
INSERT INTO ActivityLog VALUES('cmmu4kcar006grql1ahcskb8f','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722474308);
INSERT INTO ActivityLog VALUES('cmmu4ki5e006lrql1hluaxoi7','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722481890);
INSERT INTO ActivityLog VALUES('cmmu4knm4006qrql1xaic0vgt','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722488972);
INSERT INTO ActivityLog VALUES('cmmu4kt7m006vrql1mhg7m5jh','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722496226);
INSERT INTO ActivityLog VALUES('cmmu4pbqk0070rql1ka7553is','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773722706860);
INSERT INTO ActivityLog VALUES('cmmu4vs2d0075rql1ryyvj0eh','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773723007957);
INSERT INTO ActivityLog VALUES('cmmu4x9f0007arql1vd9edu9b','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773723077100);
INSERT INTO ActivityLog VALUES('cmmu53xkd007frql1lpu2857x','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773723388333);
INSERT INTO ActivityLog VALUES('cmmu555ve007krql1619howil','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773723445755);
INSERT INTO ActivityLog VALUES('cmmu58dxs007prql1tsluu48t','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773723596176);
INSERT INTO ActivityLog VALUES('cmmu5ehfn0002rqcg9vbuwxbd','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773723880643);
INSERT INTO ActivityLog VALUES('cmmu7120v0007rqcgs824kzvm','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726613376);
INSERT INTO ActivityLog VALUES('cmmu72qb8000crqcg31vy27fu','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726691508);
INSERT INTO ActivityLog VALUES('cmmu72qbs000hrqcgyi4ztova','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726691528);
INSERT INTO ActivityLog VALUES('cmmu72qd1000mrqcgxnzhbfdp','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726691574);
INSERT INTO ActivityLog VALUES('cmmu72qij000rrqcgvvj60mp8','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726691772);
INSERT INTO ActivityLog VALUES('cmmu72qq5000wrqcg5jluz2co','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726692046);
INSERT INTO ActivityLog VALUES('cmmu72wjp0011rqcgj3nlom50','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726699589);
INSERT INTO ActivityLog VALUES('cmmu72wmn0014rqcgyfb0h6bx','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726699695);
INSERT INTO ActivityLog VALUES('cmmu731z9001crqcgxnb5201m','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726706629);
INSERT INTO ActivityLog VALUES('cmmu731ze001grqcg23bjw7ag','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726706635);
INSERT INTO ActivityLog VALUES('cmmu735nf001mrqcgm1yvc7rq','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726711387);
INSERT INTO ActivityLog VALUES('cmmu735ng001orqcgnu9jnv9o','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726711389);
INSERT INTO ActivityLog VALUES('cmmu738nb001vrqcg4tnhro1x','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726715271);
INSERT INTO ActivityLog VALUES('cmmu73ar40020rqcg8xd4e15d','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726718001);
INSERT INTO ActivityLog VALUES('cmmu740ly0026rqcghbh4qx1d','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726751510);
INSERT INTO ActivityLog VALUES('cmmu740n7002brqcgo0foffzz','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726751555);
INSERT INTO ActivityLog VALUES('cmmu740pz002drqcgc1bgaw0w','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726751655);
INSERT INTO ActivityLog VALUES('cmmu7417w002krqcg8j840ksv','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726752301);
INSERT INTO ActivityLog VALUES('cmmu744wb002prqcgmswzk837','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726757062);
INSERT INTO ActivityLog VALUES('cmmu745ll002urqcgh7fd6oyc','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726757978);
INSERT INTO ActivityLog VALUES('cmmu746i5002zrqcg6j0mpz52','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726759149);
INSERT INTO ActivityLog VALUES('cmmu749a00034rqcgvvxq998g','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726762744);
INSERT INTO ActivityLog VALUES('cmmu74a5i0039rqcgrs1vz1u5','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726763878);
INSERT INTO ActivityLog VALUES('cmmu74bdo003erqcgi56c35yn','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726765469);
INSERT INTO ActivityLog VALUES('cmmu74dnb003jrqcg1xzcy3wv','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726768408);
INSERT INTO ActivityLog VALUES('cmmu74f0e003orqcgib6k8y1v','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726770174);
INSERT INTO ActivityLog VALUES('cmmu74gvt003trqcgysn31727','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726772601);
INSERT INTO ActivityLog VALUES('cmmu74jrw003yrqcg5u5zykpo','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726776348);
INSERT INTO ActivityLog VALUES('cmmu75sa70043rqcgatuxxkwl','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726834032);
INSERT INTO ActivityLog VALUES('cmmu766dy0049rqcgl94z51ff','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726852310);
INSERT INTO ActivityLog VALUES('cmmu766ec004crqcgi3o6v8ng','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726852324);
INSERT INTO ActivityLog VALUES('cmmu766ef004grqcgpi8arhlc','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726852328);
INSERT INTO ActivityLog VALUES('cmmu766o0004nrqcgoiq5b7bx','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726852672);
INSERT INTO ActivityLog VALUES('cmmu76d0u004vrqcg8el8wrkh','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726860908);
INSERT INTO ActivityLog VALUES('cmmu76d0h004trqcgcor0zwa1','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726860897);
INSERT INTO ActivityLog VALUES('cmmu76iem0055rqcgcbm9ulen','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726867886);
INSERT INTO ActivityLog VALUES('cmmu76iee0052rqcg2qs85j6g','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726867879);
INSERT INTO ActivityLog VALUES('cmmu76kvn005crqcge3do4002','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726871092);
INSERT INTO ActivityLog VALUES('cmmu76m0l005hrqcg5l46l93z','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726872566);
INSERT INTO ActivityLog VALUES('cmmu76p5l005mrqcguapyfalf','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726876631);
INSERT INTO ActivityLog VALUES('cmmu76pha005rrqcgaac4z9zn','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726877054);
INSERT INTO ActivityLog VALUES('cmmu78p7z005wrqcgx24667ki','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726970031);
INSERT INTO ActivityLog VALUES('cmmu78quj0062rqcgjthe9yj6','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726972140);
INSERT INTO ActivityLog VALUES('cmmu78qux0064rqcgq03vrfmq','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726972153);
INSERT INTO ActivityLog VALUES('cmmu78r1i006brqcgz70z7ieu','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726972391);
INSERT INTO ActivityLog VALUES('cmmu78ueg006grqcgvow472na','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726976744);
INSERT INTO ActivityLog VALUES('cmmu78v9u006lrqcgs7s4wajh','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726977875);
INSERT INTO ActivityLog VALUES('cmmu78y6g006qrqcgl9ltsx7g','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726981641);
INSERT INTO ActivityLog VALUES('cmmu790na006vrqcgbzwpn16g','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726984838);
INSERT INTO ActivityLog VALUES('cmmu791660070rqcguwiy4ti8','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726985518);
INSERT INTO ActivityLog VALUES('cmmu792zq0075rqcgl9ewqlyg','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726987878);
INSERT INTO ActivityLog VALUES('cmmu794x3007arqcgfk4jnt4u','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726990375);
INSERT INTO ActivityLog VALUES('cmmu7970z007frqcgre5o0ej3','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726993108);
INSERT INTO ActivityLog VALUES('cmmu7971r007krqcgg43pe18l','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726993135);
INSERT INTO ActivityLog VALUES('cmmu799e8007prqcgxm3ckdrs','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726996176);
INSERT INTO ActivityLog VALUES('cmmu79beg007urqcgbrf7a3of','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773726998776);
INSERT INTO ActivityLog VALUES('cmmu79dik007zrqcg2vxebghc','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727001517);
INSERT INTO ActivityLog VALUES('cmmu79efg0084rqcg1frjng36','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727002701);
INSERT INTO ActivityLog VALUES('cmmu79h0c0089rqcgoxqi9lke','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727006044);
INSERT INTO ActivityLog VALUES('cmmu79isj008erqcgl8bkgkh2','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727008355);
INSERT INTO ActivityLog VALUES('cmmu79lhb008jrqcg2atroces','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727011837);
INSERT INTO ActivityLog VALUES('cmmu79nn8008orqcgtx2t9udg','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727014644);
INSERT INTO ActivityLog VALUES('cmmu7ahr4008trqcgbf1782fj','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727053664);
INSERT INTO ActivityLog VALUES('cmmu7air4008yrqcgknfjb09s','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727054960);
INSERT INTO ActivityLog VALUES('cmmu7amel0093rqcgrpyhb7ux','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727059694);
INSERT INTO ActivityLog VALUES('cmmu7ao5d0098rqcgmlsmhg3l','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727061953);
INSERT INTO ActivityLog VALUES('cmmu7ao6q009drqcg4hcsrz3l','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727062003);
INSERT INTO ActivityLog VALUES('cmmu7arx9009irqcgpqd2q8mv','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727066845);
INSERT INTO ActivityLog VALUES('cmmu7ateo009nrqcg387na6ws','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727068768);
INSERT INTO ActivityLog VALUES('cmmu7aw6w009trqcg841pdidb','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727072377);
INSERT INTO ActivityLog VALUES('cmmu7aw73009wrqcg1x274fnq','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727072384);
INSERT INTO ActivityLog VALUES('cmmu7b11c00a2rqcg82apu42c','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727078650);
INSERT INTO ActivityLog VALUES('cmmu7d51k00a7rqcg3vr4rc4z','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727177160);
INSERT INTO ActivityLog VALUES('cmmu7dcin00acrqcg92m32ck4','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727186847);
INSERT INTO ActivityLog VALUES('cmmu7djsj00ahrqcgh8atll0x','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727196275);
INSERT INTO ActivityLog VALUES('cmmu7dwy400aorqcgse879rdv','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727213323);
INSERT INTO ActivityLog VALUES('cmmu7dwy400aqrqcgfgt4x9nb','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727213324);
INSERT INTO ActivityLog VALUES('cmmu7dwyf00asrqcg97r0pm18','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727213325);
INSERT INTO ActivityLog VALUES('cmmu7ejbo00b1rqcgf1n2nxye','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727242324);
INSERT INTO ActivityLog VALUES('cmmu7ejj200b6rqcgil9lv43c','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727242591);
INSERT INTO ActivityLog VALUES('cmmu7eljh00bbrqcgp6lvrpgr','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727245197);
INSERT INTO ActivityLog VALUES('cmmu7en8e00bgrqcg075jfs5r','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727247391);
INSERT INTO ActivityLog VALUES('cmmu7eouv00blrqcgfasdh4nh','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727249495);
INSERT INTO ActivityLog VALUES('cmmu7erxa00bqrqcg5ia865ae','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727253470);
INSERT INTO ActivityLog VALUES('cmmu7exny00bwrqcgrxwoigwt','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727260910);
INSERT INTO ActivityLog VALUES('cmmu7expl00c0rqcga0e4dduv','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727260969);
INSERT INTO ActivityLog VALUES('cmmu7f9b400c8rqcg9at7txed','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727276001);
INSERT INTO ActivityLog VALUES('cmmu7f9b400c7rqcgvwrav45w','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727276000);
INSERT INTO ActivityLog VALUES('cmmu7fl4500cgrqcgpq3xsrwp','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727291302);
INSERT INTO ActivityLog VALUES('cmmu7fl4y00ckrqcg963hietv','cmmnqsfld000103yp3d86suci','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727291330);
INSERT INTO ActivityLog VALUES('cmmu7fl6f00cprqcgrlkwkyo9','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727291383);
INSERT INTO ActivityLog VALUES('cmmu7fnfv00cvrqcg4mph88va','cmmnqsfld000103yp3d86suci','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727294316);
INSERT INTO ActivityLog VALUES('cmmu7fp5j00d0rqcghj8hjiuk','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727296536);
INSERT INTO ActivityLog VALUES('cmmu7fqhj00d5rqcgwwzmqh41','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727298263);
INSERT INTO ActivityLog VALUES('cmmu7fsbx00darqcgtb1xjb02','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727300653);
INSERT INTO ActivityLog VALUES('cmmu7fu8600dfrqcgyr9qet46','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727303110);
INSERT INTO ActivityLog VALUES('cmmu7fvyd00dkrqcgswgvpfvd','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727305350);
INSERT INTO ActivityLog VALUES('cmmu7glpe00dprqcgqx0tk0vd','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727338722);
INSERT INTO ActivityLog VALUES('cmmu7gmyn00durqcgwmkizo2g','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727340351);
INSERT INTO ActivityLog VALUES('cmmu7go7f00dzrqcg7u81e6xr','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727341963);
INSERT INTO ActivityLog VALUES('cmmu7gpey00e4rqcg9kljqq4a','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727343530);
INSERT INTO ActivityLog VALUES('cmmu7gpry00e9rqcgmxyicgdw','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727343998);
INSERT INTO ActivityLog VALUES('cmmu7gq3x00eerqcgs19pu0vi','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727344429);
INSERT INTO ActivityLog VALUES('cmmu7grdc00ejrqcgddlr6v7i','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727346065);
INSERT INTO ActivityLog VALUES('cmmu7gtno00eorqcg927mn491','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727349029);
INSERT INTO ActivityLog VALUES('cmmu7gwqu00etrqcgcbcapzm2','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727353031);
INSERT INTO ActivityLog VALUES('cmmu7gwwa00eyrqcgm8ejl303','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727353226);
INSERT INTO ActivityLog VALUES('cmmu7h4hu00f3rqcg1qf6r059','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727363074);
INSERT INTO ActivityLog VALUES('cmmu7h6i400f8rqcgzwsrg9zj','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727365676);
INSERT INTO ActivityLog VALUES('cmmu7h6us00fdrqcg1al0sogr','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727366133);
INSERT INTO ActivityLog VALUES('cmmu7hjrm00firqcg9hluo4pd','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727382866);
INSERT INTO ActivityLog VALUES('cmmu7hmyi00fnrqcgmfv11s7l','cmmnqsfld000203yp9v7ir4ts','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727387003);
INSERT INTO ActivityLog VALUES('cmmu7hnn000fsrqcgzbbiyyl5','cmmnqsfld000103yp3d86suci','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727387884);
INSERT INTO ActivityLog VALUES('cmmu7hrz100fxrqcg2kwhgigo','cmmnqsfle000303yp8iavv5sw','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727393502);
INSERT INTO ActivityLog VALUES('cmmu7j0hh00g2rqcgnuj6khwi','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727451189);
INSERT INTO ActivityLog VALUES('cmmu7j0jq00g9rqcgbgko25v4','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727451271);
INSERT INTO ActivityLog VALUES('cmmu7j0l500gdrqcgk4yiwa18','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727451321);
INSERT INTO ActivityLog VALUES('cmmu7j0p700ghrqcg1w2yoaeb','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727451468);
INSERT INTO ActivityLog VALUES('cmmu7j4g500gmrqcgkocdfu4h','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727456323);
INSERT INTO ActivityLog VALUES('cmmu7j6ap00grrqcghtrfloe3','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727458721);
INSERT INTO ActivityLog VALUES('cmmu7j6eg00gwrqcgzqgt17j1','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727458856);
INSERT INTO ActivityLog VALUES('cmmu7ja5j00h1rqcgouoxwaai','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727463720);
INSERT INTO ActivityLog VALUES('cmmu7jdvz00h7rqcgyvy8088u','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727468560);
INSERT INTO ActivityLog VALUES('cmmu7jdwb00hbrqcgqupaeo0b','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727468571);
INSERT INTO ActivityLog VALUES('cmmu7kup900hgrqcgnksjc1pj','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727537005);
INSERT INTO ActivityLog VALUES('cmmu7l0gn00hlrqcg3jyszgfd','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727544472);
INSERT INTO ActivityLog VALUES('cmmu7mj3100hqrqcgtb2jpsqc','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727615261);
INSERT INTO ActivityLog VALUES('cmmu7owfx00hvrqcgtinqcvyo','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727725885);
INSERT INTO ActivityLog VALUES('cmmu7qc9100i0rqcg57aq4r1w','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727793030);
INSERT INTO ActivityLog VALUES('cmmu7rnh700i5rqcg5pl50lqb','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727854235);
INSERT INTO ActivityLog VALUES('cmmu7trbx00iarqcg7abtck3z','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773727952541);
INSERT INTO ActivityLog VALUES('cmmu7war300ifrqcgzaz41ixi','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773728071023);
INSERT INTO ActivityLog VALUES('cmmu88x7h0002rqd8uosu8lrm','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773728659998);
INSERT INTO ActivityLog VALUES('cmmu8uskz0002rqfcgm1idyoz','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773729680435);
INSERT INTO ActivityLog VALUES('cmmu94x7h0002rq2irtp3k649','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730152990);
INSERT INTO ActivityLog VALUES('cmmu954x10007rq2i51n12hug','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730162981);
INSERT INTO ActivityLog VALUES('cmmu96n7t0002rq6br6r0hi0c','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730233354);
INSERT INTO ActivityLog VALUES('cmmu96tkd0007rq6bfl0oifhd','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730241582);
INSERT INTO ActivityLog VALUES('cmmu974yu000crq6bdnqh1jp6','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730256359);
INSERT INTO ActivityLog VALUES('cmmu98bhe000hrq6by41e9xdb','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730311458);
INSERT INTO ActivityLog VALUES('cmmu98bi1000mrq6bzzivuacr','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730311482);
INSERT INTO ActivityLog VALUES('cmmu98bmd000srq6buc364ahz','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730311638);
INSERT INTO ActivityLog VALUES('cmmu98bnq000wrq6bsxcshzcv','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730311687);
INSERT INTO ActivityLog VALUES('cmmu98oj80015rq6b7n8jubf0','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730328372);
INSERT INTO ActivityLog VALUES('cmmu98ojg0019rq6bcbyzzxq6','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730328381);
INSERT INTO ActivityLog VALUES('cmmu98oiv0012rq6bgyoy9g86','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730328358);
INSERT INTO ActivityLog VALUES('cmmu98oot001grq6bxsj82yps','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730328573);
INSERT INTO ActivityLog VALUES('cmmu98vnc001nrq6bda653yst','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730337592);
INSERT INTO ActivityLog VALUES('cmmu98vnh001prq6by4hlbxl9','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730337597);
INSERT INTO ActivityLog VALUES('cmmu98vsc001vrq6bbyqe9rp4','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730337772);
INSERT INTO ActivityLog VALUES('cmmu98wyg0020rq6b17nxlf0q','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730339288);
INSERT INTO ActivityLog VALUES('cmmu992kf0025rq6btblv3veo','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730346559);
INSERT INTO ActivityLog VALUES('cmmu9932k002drq6bjrnrggxm','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730347212);
INSERT INTO ActivityLog VALUES('cmmu9932h002arq6b5sfgatr3','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730347209);
INSERT INTO ActivityLog VALUES('cmmu994ub002krq6b4hddus9n','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730349508);
INSERT INTO ActivityLog VALUES('cmmu9acpw002rrq6b9pwm9f4s','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730406372);
INSERT INTO ActivityLog VALUES('cmmu9acql002vrq6bhjob8766','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730406397);
INSERT INTO ActivityLog VALUES('cmmu9acqp002xrq6b4jqz08y7','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730406400);
INSERT INTO ActivityLog VALUES('cmmu9ad820034rq6b8psmfng5','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730407026);
INSERT INTO ActivityLog VALUES('cmmu9avod003arq6bav4cew11','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730430941);
INSERT INTO ActivityLog VALUES('cmmu9avop003frq6bzbzlfix4','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730430953);
INSERT INTO ActivityLog VALUES('cmmu9avqa003jrq6bjnwlvkuz','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730431010);
INSERT INTO ActivityLog VALUES('cmmu9avxs003orq6b4zx5dwr4','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730431280);
INSERT INTO ActivityLog VALUES('cmmu9bczu003xrq6b42eu8xjp','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730453386);
INSERT INTO ActivityLog VALUES('cmmu9bczt003vrq6bfvpj9iai','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730453384);
INSERT INTO ActivityLog VALUES('cmmu9bd0f0042rq6bqscach43','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730453408);
INSERT INTO ActivityLog VALUES('cmmu9bd2k0048rq6b2xroirny','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730453484);
INSERT INTO ActivityLog VALUES('cmmu9bteq004erq6bv7pwij9t','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730474658);
INSERT INTO ActivityLog VALUES('cmmu9btf5004irq6b1nuan7ds','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730474673);
INSERT INTO ActivityLog VALUES('cmmu9btff004nrq6b4uz7yows','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730474683);
INSERT INTO ActivityLog VALUES('cmmu9btir004srq6bh2nn0abr','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730474803);
INSERT INTO ActivityLog VALUES('cmmu9cabe004yrq6b86j8pqe8','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730496570);
INSERT INTO ActivityLog VALUES('cmmu9cabg0050rq6bmylszosc','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730496572);
INSERT INTO ActivityLog VALUES('cmmu9cabt0057rq6bpgikaqfl','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730496586);
INSERT INTO ActivityLog VALUES('cmmu9cbcx005crq6btupsecn0','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730497922);
INSERT INTO ActivityLog VALUES('cmmu9ci4c005hrq6boa4310tk','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730506684);
INSERT INTO ActivityLog VALUES('cmmu9ci4p005mrq6bwo3l1na4','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730506697);
INSERT INTO ActivityLog VALUES('cmmu9ci5w005rrq6byfqqgjuk','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730506740);
INSERT INTO ActivityLog VALUES('cmmu9cinq005wrq6boaq70bo7','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730507383);
INSERT INTO ActivityLog VALUES('cmmu9cpd40062rq6b9ze1xv6w','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730516073);
INSERT INTO ActivityLog VALUES('cmmu9cpdx0066rq6bm34lp1sx','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730516102);
INSERT INTO ActivityLog VALUES('cmmu9cpq6006brq6bmufqp3w3','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730516542);
INSERT INTO ActivityLog VALUES('cmmu9cq07006grq6b3q8op3lx','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730516904);
INSERT INTO ActivityLog VALUES('cmmu9cw2p006lrq6bs2hpmk3y','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730524770);
INSERT INTO ActivityLog VALUES('cmmu9cw2z006qrq6b9bdn37lj','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730524780);
INSERT INTO ActivityLog VALUES('cmmu9cwkf006vrq6boamdzug4','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730525407);
INSERT INTO ActivityLog VALUES('cmmu9cwvc0070rq6bi0gel5ff','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730525800);
INSERT INTO ActivityLog VALUES('cmmu9deax0076rq6b61piafxd','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730548393);
INSERT INTO ActivityLog VALUES('cmmu9deb1007arq6bd860jjyi','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730548397);
INSERT INTO ActivityLog VALUES('cmmu9dec0007grq6bu1qli05e','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730548432);
INSERT INTO ActivityLog VALUES('cmmu9dec3007krq6bazb1jx5s','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730548435);
INSERT INTO ActivityLog VALUES('cmmu9dn1u007prq6bjxhlonhu','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730559730);
INSERT INTO ActivityLog VALUES('cmmu9dn2a007urq6bgg2j21ax','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730559747);
INSERT INTO ActivityLog VALUES('cmmu9dn2o007zrq6b7ilzyyom','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730559760);
INSERT INTO ActivityLog VALUES('cmmu9dn4f0084rq6bvleulhn4','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730559823);
INSERT INTO ActivityLog VALUES('cmmu9du7d0089rq6bqgibim34','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730569002);
INSERT INTO ActivityLog VALUES('cmmu9duo7008erq6bhjgbx7xe','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730569607);
INSERT INTO ActivityLog VALUES('cmmu9duok008jrq6bbf3otrtk','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730569620);
INSERT INTO ActivityLog VALUES('cmmu9dup6008orq6bo490cf2a','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730569642);
INSERT INTO ActivityLog VALUES('cmmu9e0tl008trq6bcs0szycb','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730577578);
INSERT INTO ActivityLog VALUES('cmmu9e1vp008yrq6b1poyb55k','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730578949);
INSERT INTO ActivityLog VALUES('cmmu9e1vy0094rq6bbjpvc8i0','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730578958);
INSERT INTO ActivityLog VALUES('cmmu9e1w30098rq6b0lfon73j','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730578963);
INSERT INTO ActivityLog VALUES('cmmu9fj8v009drq6bubp89pf7','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773730648111);
INSERT INTO ActivityLog VALUES('cmmu9ydda009irq6bvuhgl78w','cmmnqsfl8000003yp8yo84l46','LOGIN','auth',NULL,'null',NULL,'success',NULL,1773731526959);
CREATE TABLE IF NOT EXISTS "ScheduledReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "monthOfYear" INTEGER,
    "time" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "parameters" JSONB NOT NULL,
    "recipients" TEXT NOT NULL,
    "outputFormat" TEXT NOT NULL DEFAULT 'PDF',
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "ScheduledReportRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduledReportId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "runAt" DATETIME NOT NULL,
    "errorMessage" TEXT,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "generatedRecords" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduledReportRun_scheduledReportId_fkey" FOREIGN KEY ("scheduledReportId") REFERENCES "ScheduledReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ANALYZE sqlite_schema;
INSERT INTO sqlite_stat1 VALUES('Vendor','Vendor_externalRefId_key','10 10');
INSERT INTO sqlite_stat1 VALUES('Vendor','Vendor_code_key','10 1');
INSERT INTO sqlite_stat1 VALUES('Vendor','sqlite_autoindex_Vendor_1','10 1');
INSERT INTO sqlite_stat1 VALUES('ChartOfAccount','ChartOfAccount_parentId_idx','73 4');
INSERT INTO sqlite_stat1 VALUES('ChartOfAccount','ChartOfAccount_code_key','73 1');
INSERT INTO sqlite_stat1 VALUES('ChartOfAccount','sqlite_autoindex_ChartOfAccount_1','73 1');
INSERT INTO sqlite_stat1 VALUES('DocumentNumber','DocumentNumber_type_key','18 1');
INSERT INTO sqlite_stat1 VALUES('DocumentNumber','sqlite_autoindex_DocumentNumber_1','18 1');
CREATE TABLE IF NOT EXISTS "AccountingPeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "closedBy" TEXT,
    "closedAt" DATETIME,
    "reopenedBy" TEXT,
    "reopenedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Currency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameTh" TEXT,
    "symbol" TEXT NOT NULL,
    "isBase" BOOLEAN NOT NULL DEFAULT false,
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "ExchangeRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currencyId" TEXT,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceRef" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExchangeRate_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "CurrencyGainLoss" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "originalRate" REAL NOT NULL,
    "currentRate" REAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "gainLossAmount" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "isPosted" BOOLEAN NOT NULL DEFAULT false,
    "journalEntryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "TaxForm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formType" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "totalTax" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" DATETIME,
    "submittedBy" TEXT,
    "filingDate" DATETIME,
    "receiptNo" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "TaxFormLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taxFormId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "payeeId" TEXT,
    "payeeName" TEXT NOT NULL,
    "payeeTaxId" TEXT,
    "payeeAddress" TEXT,
    "description" TEXT NOT NULL,
    "incomeType" TEXT NOT NULL,
    "incomeAmount" INTEGER NOT NULL,
    "taxRate" REAL NOT NULL,
    "taxAmount" INTEGER NOT NULL,
    "documentRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaxFormLine_taxFormId_fkey" FOREIGN KEY ("taxFormId") REFERENCES "TaxForm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "actual" INTEGER NOT NULL DEFAULT 0,
    "variance" INTEGER NOT NULL DEFAULT 0,
    "alertAt" REAL NOT NULL DEFAULT 80,
    "isAlerted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Budget_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartOfAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "BudgetAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "triggeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" DATETIME,
    CONSTRAINT "BudgetAlert_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Entity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "taxId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "InterCompanyTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromEntityId" TEXT NOT NULL,
    "toEntityId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentNo" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "eliminationEntryId" TEXT,
    "isEliminated" BOOLEAN NOT NULL DEFAULT false,
    "eliminatedAt" DATETIME,
    "eliminatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InterCompanyTransaction_fromEntityId_fkey" FOREIGN KEY ("fromEntityId") REFERENCES "Entity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InterCompanyTransaction_toEntityId_fkey" FOREIGN KEY ("toEntityId") REFERENCES "Entity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ConsolidationAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "fromAccountId" TEXT NOT NULL,
    "toAccountId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "journalEntryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "WebhookEndpoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "retryCount" INTEGER NOT NULL DEFAULT 3,
    "lastTriggered" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "WebhookDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "duration" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "deliveredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "WebhookEndpoint" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ApiRequestLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "sessionId" TEXT,
    "apiVersion" TEXT NOT NULL DEFAULT 'v1',
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "query" TEXT,
    "statusCode" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "error" TEXT
);
CREATE TABLE IF NOT EXISTS "RateLimitLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "windowStart" DATETIME NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedUntil" DATETIME
);
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "prevHash" TEXT,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO AuditLog VALUES('cmmu3rc5q000grqzhyf7xuybz',1773721121103,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','2bc93c323d6708761ed3d5340fca3b0905c5eb3a979d944db01390e57ed69b05',NULL);
INSERT INTO AuditLog VALUES('cmmu3td5v003zrqzhtuxhsicc',1773721215715,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','19ccbdcc9f8b8e08533c10eed50e18b2e69947bbbc81d239938e84ec0fd3d21a','2bc93c323d6708761ed3d5340fca3b0905c5eb3a979d944db01390e57ed69b05');
INSERT INTO AuditLog VALUES('cmmu3u2nb0044rqzhoc7qvt79',1773721248743,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','fc5234d33c4ad05b545ee02ce2fe2df85349e9c7dc594fd2f910cc315a2240e9','19ccbdcc9f8b8e08533c10eed50e18b2e69947bbbc81d239938e84ec0fd3d21a');
INSERT INTO AuditLog VALUES('cmmu3z2sc0004rqpnd37zdui3',1773721482204,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','b3f6f55f1223a11bc1497445cc530c84f7bf5eaf391d305db7368617539bab12','fc5234d33c4ad05b545ee02ce2fe2df85349e9c7dc594fd2f910cc315a2240e9');
INSERT INTO AuditLog VALUES('cmmu3zck30009rqpn0qcw9836',1773721494868,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','33c7e76f6e137e41c61df5b0466b6acef1b4933ba075ff0567cd26b5cb4e04f5','b3f6f55f1223a11bc1497445cc530c84f7bf5eaf391d305db7368617539bab12');
INSERT INTO AuditLog VALUES('cmmu427sf000erqpn8f1dd6cg',1773721628655,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','3094dc8f8459191333c8fffb59098a4c2013e3d979bc19138ad8dab0e021c764','33c7e76f6e137e41c61df5b0466b6acef1b4933ba075ff0567cd26b5cb4e04f5');
INSERT INTO AuditLog VALUES('cmmu476a70004rqeawafv7oj9',1773721859984,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','a38dcb67068d626e21939b87d794830214d2142a2e3e564fc654b6c0319a5ff0','3094dc8f8459191333c8fffb59098a4c2013e3d979bc19138ad8dab0e021c764');
INSERT INTO AuditLog VALUES('cmmu4dmlb0007rql10z1yrjrp',1773722161056,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','ff0d7ee40a7c44d7e6a676930edec94210982b121d5653b95068540fb5dadb39','a38dcb67068d626e21939b87d794830214d2142a2e3e564fc654b6c0319a5ff0');
INSERT INTO AuditLog VALUES('cmmu4dmlq000frql1ivd6u29h',1773722161070,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','39b74928e25b835dca41f1d72324db7b9ea4af62d67f23b79be9def2d43ab721','ff0d7ee40a7c44d7e6a676930edec94210982b121d5653b95068540fb5dadb39');
INSERT INTO AuditLog VALUES('cmmu4dmlm000brql1nddqgi18',1773722161067,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','10862100f415342cbe3aa353c5d104e5104b32c27bfaa26e101b4affe2589505','a38dcb67068d626e21939b87d794830214d2142a2e3e564fc654b6c0319a5ff0');
INSERT INTO AuditLog VALUES('cmmu4dmoh000jrql1ucib7ai7',1773722161169,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','d4758dc97432408e7938a60dde7107a1f5afbbf6d9cd64d49646c78673535304','39b74928e25b835dca41f1d72324db7b9ea4af62d67f23b79be9def2d43ab721');
INSERT INTO AuditLog VALUES('cmmu4dywt000rrql18u95tbpd',1773722177021,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','67eccd5643d1f8846a13ed7262b610b0bdd138b64208e0cbe4fac8f33a122316','d4758dc97432408e7938a60dde7107a1f5afbbf6d9cd64d49646c78673535304');
INSERT INTO AuditLog VALUES('cmmu4dyyq000trql1kczbyuk1',1773722177090,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','073807276d405a93c7e23983e22510531c8e1c0ee448a95a02953c4c68f42990','d4758dc97432408e7938a60dde7107a1f5afbbf6d9cd64d49646c78673535304');
INSERT INTO AuditLog VALUES('cmmu4dzb0000yrql1vqu1z4o7',1773722177532,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','aae84220073bd44154ca92c451093029f0e4eb1b80e1455d14ef7b3c0463e3fb','073807276d405a93c7e23983e22510531c8e1c0ee448a95a02953c4c68f42990');
INSERT INTO AuditLog VALUES('cmmu4dzkx0013rql1q3nzwzbp',1773722177889,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','f16f38698cba3fc16e01a8e144ec8a21f36d99bf9e1cad8b1b4022e6019b21fa','aae84220073bd44154ca92c451093029f0e4eb1b80e1455d14ef7b3c0463e3fb');
INSERT INTO AuditLog VALUES('cmmu4e4mv0018rql1a3dtmjt3',1773722184440,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','e44a30286a91b3b32a94ff3e19041f6dc679d625ed57ee9babf1cfcf483030c5','f16f38698cba3fc16e01a8e144ec8a21f36d99bf9e1cad8b1b4022e6019b21fa');
INSERT INTO AuditLog VALUES('cmmu4e4n7001drql12nrpex84',1773722184451,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','9c2bfe4ff80b8af575230ec91617f2bb9a2059001460243b96e21af6b70b2056','e44a30286a91b3b32a94ff3e19041f6dc679d625ed57ee9babf1cfcf483030c5');
INSERT INTO AuditLog VALUES('cmmu4e6er001irql1dxz0ew8s',1773722186739,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','ff188beb6324c5850b267cf0b45c59ad5e191f83c291efda407c02dfea041afa','9c2bfe4ff80b8af575230ec91617f2bb9a2059001460243b96e21af6b70b2056');
INSERT INTO AuditLog VALUES('cmmu4e6x8001nrql1nsmlampz',1773722187405,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','35150737a82380bc978239161cccca3b71d5b94640da83c412ca5f0aade5a67d','ff188beb6324c5850b267cf0b45c59ad5e191f83c291efda407c02dfea041afa');
INSERT INTO AuditLog VALUES('cmmu4ebr9001srql17ihp2mwy',1773722193669,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','adb589b40187f52e5942af2aa4f884818383489b24fb3a36c10670228e6dd32c','35150737a82380bc978239161cccca3b71d5b94640da83c412ca5f0aade5a67d');
INSERT INTO AuditLog VALUES('cmmu4ebrq001xrql12zseibks',1773722193686,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','b7270e2b4120b67991afb33bf63402629c5fa1c3893764096da8437e9c7638da','adb589b40187f52e5942af2aa4f884818383489b24fb3a36c10670228e6dd32c');
INSERT INTO AuditLog VALUES('cmmu4ednv0022rql1z3gdbwf5',1773722196139,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','f49709bab7f923d4a20f9c927ba089a3431478da4f5cd808255bd6977763bbd4','b7270e2b4120b67991afb33bf63402629c5fa1c3893764096da8437e9c7638da');
INSERT INTO AuditLog VALUES('cmmu4ee3x0027rql1pm0ibgc7',1773722196718,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','634c4dd96403d2806d3c2946bf7b8378dad8e348999fdae624f4464a53968d4c','f49709bab7f923d4a20f9c927ba089a3431478da4f5cd808255bd6977763bbd4');
INSERT INTO AuditLog VALUES('cmmu4evfu002frql1vd6gkqvw',1773722219178,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','eec5b281519b67cd4136a4aee9064e31bba118699723b14d7da8e78c94fa6142','634c4dd96403d2806d3c2946bf7b8378dad8e348999fdae624f4464a53968d4c');
INSERT INTO AuditLog VALUES('cmmu4evg1002hrql1iuofhjvd',1773722219186,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','eec5b281519b67cd4136a4aee9064e31bba118699723b14d7da8e78c94fa6142','634c4dd96403d2806d3c2946bf7b8378dad8e348999fdae624f4464a53968d4c');
INSERT INTO AuditLog VALUES('cmmu4g3ay002qrql1lregxdqp',1773722276026,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','3ad5221bfc0da2b953c3360e0dfff0344f072fce33b42d5ac12433ff5386cfaf','eec5b281519b67cd4136a4aee9064e31bba118699723b14d7da8e78c94fa6142');
INSERT INTO AuditLog VALUES('cmmu4g3b0002srql18ibppdn6',1773722276029,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','ea79a61395ce5b2ec66c45fdce10606418e0338242b190eae893b0cecdbe8deb','eec5b281519b67cd4136a4aee9064e31bba118699723b14d7da8e78c94fa6142');
INSERT INTO AuditLog VALUES('cmmu4g3cf002xrql1q6tpofex',1773722276080,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','f42d7e7a516421f57ecf83f282c327a1c341cac5b16a80031def45a8ee82429d','ea79a61395ce5b2ec66c45fdce10606418e0338242b190eae893b0cecdbe8deb');
INSERT INTO AuditLog VALUES('cmmu4g3i20031rql1641m2sp8',1773722276283,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','2bb8e87835ac39905d706e63032f528eac65775ec0a239e146fe809e9d5606c9','f42d7e7a516421f57ecf83f282c327a1c341cac5b16a80031def45a8ee82429d');
INSERT INTO AuditLog VALUES('cmmu4g9v70036rql1j7ketggp',1773722284531,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','a6e19f2ae67838a837815c09f1526cccc3d1c97418b4dad2394521f4359e9044','2bb8e87835ac39905d706e63032f528eac65775ec0a239e146fe809e9d5606c9');
INSERT INTO AuditLog VALUES('cmmu4ge7u003brql128uhylv8',1773722290170,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','bfb45e98fa7db91386e99d5bb4d70f872a95185cbef20256905f4e79ce85707e','a6e19f2ae67838a837815c09f1526cccc3d1c97418b4dad2394521f4359e9044');
INSERT INTO AuditLog VALUES('cmmu4gegx003grql1j4iy28n6',1773722290498,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','57d0c5e6b29b7a66cb08ce31bdd3a8de32ea5e217f387c718ce1ae6e7a7db37b','bfb45e98fa7db91386e99d5bb4d70f872a95185cbef20256905f4e79ce85707e');
INSERT INTO AuditLog VALUES('cmmu4gfep003lrql1vpv2afv1',1773722291713,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','51aa3e6c11ff3a59505317e0081812580be9e201643c61cbb36833bc53528424','57d0c5e6b29b7a66cb08ce31bdd3a8de32ea5e217f387c718ce1ae6e7a7db37b');
INSERT INTO AuditLog VALUES('cmmu4gh1f003qrql16rqf9vz9',1773722293828,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','d40d2c0125ed6834bfb74bec4ec8198bdddeadf96cab75d7b5184728a7ca20f0','51aa3e6c11ff3a59505317e0081812580be9e201643c61cbb36833bc53528424');
INSERT INTO AuditLog VALUES('cmmu4gihx003vrql1aowa7toy',1773722295717,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','23292c2a98300d0f4796b9ba3967ed27e22650fe32e66e3423a9d6ba63843d1b','d40d2c0125ed6834bfb74bec4ec8198bdddeadf96cab75d7b5184728a7ca20f0');
INSERT INTO AuditLog VALUES('cmmu4glvb0040rql1trkjdu6g',1773722300087,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','2e0a277a5bc56ebb6e97dce87f199e023885794ab77ce2a4b7714ffb1ef317c8','23292c2a98300d0f4796b9ba3967ed27e22650fe32e66e3423a9d6ba63843d1b');
INSERT INTO AuditLog VALUES('cmmu4gn7f0045rql1o2exl77a',1773722301819,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','25574c42fff8d8219d340aa28f2c13c1bff09c7588167f7d7a28cccb2c18c1b6','2e0a277a5bc56ebb6e97dce87f199e023885794ab77ce2a4b7714ffb1ef317c8');
INSERT INTO AuditLog VALUES('cmmu4i0xf004arql1f4n3fw26',1773722366259,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','ec4999229feabbeda3a8b77d1476fcec25722e75ebd2c6a944358ae69a5ac6b1','25574c42fff8d8219d340aa28f2c13c1bff09c7588167f7d7a28cccb2c18c1b6');
INSERT INTO AuditLog VALUES('cmmu4i1gt004frql1srv2xv89',1773722366957,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','efee66296cf2aa7d147a0ca8157a3c6ee441204a4c9e47dd5441d797441aef3a','ec4999229feabbeda3a8b77d1476fcec25722e75ebd2c6a944358ae69a5ac6b1');
INSERT INTO AuditLog VALUES('cmmu4i27j004krql1av5nbr4t',1773722367920,'cmmnqsfld000103yp3d86suci','LOGIN','SECURITY','cmmnqsfld000103yp3d86suci','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','4eeccfab84e71a46b1e9c0c894f33eb7975ee4818bd28d064fe2837400775064','efee66296cf2aa7d147a0ca8157a3c6ee441204a4c9e47dd5441d797441aef3a');
INSERT INTO AuditLog VALUES('cmmu4i54p004prql1ayj45dg6',1773722371706,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','ab70a170ca58e5b2d7b3eb7ff36eaa485eec9eb9a40061aad8e952d99115768e','4eeccfab84e71a46b1e9c0c894f33eb7975ee4818bd28d064fe2837400775064');
INSERT INTO AuditLog VALUES('cmmu4iajb004urql1enw9a9tz',1773722378712,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','747c9f7cf4370fcdddd657d5b7acec693931b36aced711410f3e6eb3bdecf5e6','ab70a170ca58e5b2d7b3eb7ff36eaa485eec9eb9a40061aad8e952d99115768e');
INSERT INTO AuditLog VALUES('cmmu4ifyz004zrql1pu40ir62',1773722385755,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','3eff66a10ac4e77bd50a6bf8ed7c44190d785f8e42f400553d1ce92b76b46617','747c9f7cf4370fcdddd657d5b7acec693931b36aced711410f3e6eb3bdecf5e6');
INSERT INTO AuditLog VALUES('cmmu4iler0054rql1a4a7bz2o',1773722392804,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','010ec6f5372b7a98986e06159fbcf75a441a86ec56a7eea8adba56b7378671ba','3eff66a10ac4e77bd50a6bf8ed7c44190d785f8e42f400553d1ce92b76b46617');
INSERT INTO AuditLog VALUES('cmmu4iquj0059rql1ceqbad45',1773722399851,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','c504573d70b901cf2eb46ff71b27b8cf678bd74d72135bb151c491447dcb4ffa','010ec6f5372b7a98986e06159fbcf75a441a86ec56a7eea8adba56b7378671ba');
INSERT INTO AuditLog VALUES('cmmu4iw9f005erql1fnt71xfi',1773722406867,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','a3777b3d697037876bca1680346da3dfb80b41e8a0759211363e340ff5f896f8','c504573d70b901cf2eb46ff71b27b8cf678bd74d72135bb151c491447dcb4ffa');
INSERT INTO AuditLog VALUES('cmmu4j1ws005jrql13vpfhda1',1773722414188,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','a605d76bddca152c88226ae660288795fda5357f12f7f09b93cae781a044bdfb','a3777b3d697037876bca1680346da3dfb80b41e8a0759211363e340ff5f896f8');
INSERT INTO AuditLog VALUES('cmmu4j7or005orql15gloaed8',1773722421675,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','51d100802364199460617a51cd6a712d1b083377dd353a52b14d3215663d72ae','a605d76bddca152c88226ae660288795fda5357f12f7f09b93cae781a044bdfb');
INSERT INTO AuditLog VALUES('cmmu4jl2d005trql157dia459',1773722439013,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','569ee6fb0a6ce60d7a3623009c58a35883bce18f3d7b7264ba8e0cab1d545ade','51d100802364199460617a51cd6a712d1b083377dd353a52b14d3215663d72ae');
INSERT INTO AuditLog VALUES('cmmu4jqga005yrql1y369dvue',1773722445994,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','5b429c9492cb3cdd091c9e10a9d195eb8008e94543970c1de4f6f44883081bfa','569ee6fb0a6ce60d7a3623009c58a35883bce18f3d7b7264ba8e0cab1d545ade');
INSERT INTO AuditLog VALUES('cmmu4jvu60063rql1rnu1uri9',1773722452975,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','9d6dd9f19b792cf3602eac06231c6728a718398b1187c122f62113a546fb8724','5b429c9492cb3cdd091c9e10a9d195eb8008e94543970c1de4f6f44883081bfa');
INSERT INTO AuditLog VALUES('cmmu4k1gh0068rql1d17z4uq7',1773722460257,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','7fc313562e06366b17e71d7e7288e07dcbec1afb25163956ccde5b4bba1df855','9d6dd9f19b792cf3602eac06231c6728a718398b1187c122f62113a546fb8724');
INSERT INTO AuditLog VALUES('cmmu4k6xn006drql1fdxn5omm',1773722467356,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','341915c6491be393fba0ff54984e9a8a0bffb5c91d09687300ffca61a00453fa','7fc313562e06366b17e71d7e7288e07dcbec1afb25163956ccde5b4bba1df855');
INSERT INTO AuditLog VALUES('cmmu4kcat006irql1ctmfj20s',1773722474309,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','c7605723d7f27c9d68937ea80a28e7cf5b7450d99feda11e386fcace55257023','341915c6491be393fba0ff54984e9a8a0bffb5c91d09687300ffca61a00453fa');
INSERT INTO AuditLog VALUES('cmmu4ki5j006nrql11jsm1j17',1773722481895,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','e0d263ddc1fc2a49ea4a5107fde6d05a9cdae0f4599f82d0815243e5bf56ed7a','c7605723d7f27c9d68937ea80a28e7cf5b7450d99feda11e386fcace55257023');
INSERT INTO AuditLog VALUES('cmmu4knm5006srql13rwlv33m',1773722488974,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','2b9049df35c4c1dcb03af8ea022db40e1e4e391e498b0238922bbb835f402b11','e0d263ddc1fc2a49ea4a5107fde6d05a9cdae0f4599f82d0815243e5bf56ed7a');
INSERT INTO AuditLog VALUES('cmmu4kt7n006xrql1o1bx3vi0',1773722496227,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','c5890b7355426370c3777afadc15cd289606cb6b7a59c6c54a07964b7776db5f','2b9049df35c4c1dcb03af8ea022db40e1e4e391e498b0238922bbb835f402b11');
INSERT INTO AuditLog VALUES('cmmu4pbql0072rql1z7dotlz5',1773722706862,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','71bd9b4202d3a2ae6885ddc80bd088c0fcdf93f9c56b95152c2369a380f2d88a','c5890b7355426370c3777afadc15cd289606cb6b7a59c6c54a07964b7776db5f');
INSERT INTO AuditLog VALUES('cmmu4vs2h0077rql1gic7eiw8',1773723007962,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2fc2e63855bb57c31fcd0d04bc34154cce3ba8129d424759bedee20a9fe85ba1','71bd9b4202d3a2ae6885ddc80bd088c0fcdf93f9c56b95152c2369a380f2d88a');
INSERT INTO AuditLog VALUES('cmmu4x9f3007crql12hkoc59o',1773723077103,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','8bb3516a61ff43b54bf0653059e3177def6bb13bed0f0e8dc2cbadb7f7a64497','2fc2e63855bb57c31fcd0d04bc34154cce3ba8129d424759bedee20a9fe85ba1');
INSERT INTO AuditLog VALUES('cmmu53xke007hrql1ifmxzryj',1773723388334,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','54ce0671fb0b5481bd4ec0e2ce2af6187d01f158798cef8d56fd4f138ef715bf','8bb3516a61ff43b54bf0653059e3177def6bb13bed0f0e8dc2cbadb7f7a64497');
INSERT INTO AuditLog VALUES('cmmu555vg007mrql1h39diqrr',1773723445756,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','ad93ef4c9d235ce4e94ee81b68cc2da25f3b28ba68bbd1025c7e4cd918994f14','54ce0671fb0b5481bd4ec0e2ce2af6187d01f158798cef8d56fd4f138ef715bf');
INSERT INTO AuditLog VALUES('cmmu58dxv007rrql1tdamyvf1',1773723596180,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','3a5f30cae5eecc9e1a0819a85bdd4835208393bdffb0717d9b77d7eb212e56b2','ad93ef4c9d235ce4e94ee81b68cc2da25f3b28ba68bbd1025c7e4cd918994f14');
INSERT INTO AuditLog VALUES('cmmu5ehfp0004rqcg7eio4mqo',1773723880646,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','66df8bd12b3c559dedd3e20702578336c48a2077892a90df5c8f9c88cf0f68bd','3a5f30cae5eecc9e1a0819a85bdd4835208393bdffb0717d9b77d7eb212e56b2');
INSERT INTO AuditLog VALUES('cmmu7120x0009rqcgn2vfoqt0',1773726613378,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','d85621cce4f960c43ab056408fc18360677e9a450e7255bf9ccfb8ce145e7af4','66df8bd12b3c559dedd3e20702578336c48a2077892a90df5c8f9c88cf0f68bd');
INSERT INTO AuditLog VALUES('cmmu72qbi000erqcgzg5pe85r',1773726691518,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','7124ad0e7ccc8c57d11b47a0b19c3fc5f12ecdbef85fc32fc0dc07167a0325ac','d85621cce4f960c43ab056408fc18360677e9a450e7255bf9ccfb8ce145e7af4');
INSERT INTO AuditLog VALUES('cmmu72qci000jrqcgb21qkctu',1773726691554,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','44ae586d7ed1cbab53116ebe5f1a0459816620ebaea10cb2f065aef1f1549275','7124ad0e7ccc8c57d11b47a0b19c3fc5f12ecdbef85fc32fc0dc07167a0325ac');
INSERT INTO AuditLog VALUES('cmmu72qi3000prqcg86gs1nt3',1773726691756,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','55da7b3e28fd1f712044f211a15c70f311cd0446e597c54e74e956f42f7e992b','44ae586d7ed1cbab53116ebe5f1a0459816620ebaea10cb2f065aef1f1549275');
INSERT INTO AuditLog VALUES('cmmu72qlw000trqcg4epp3y2r',1773726691892,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','2cbdada4d4fa26fd2269ebd6c605aa23e3bd688b76e0ae112f76c21cc776f90b','55da7b3e28fd1f712044f211a15c70f311cd0446e597c54e74e956f42f7e992b');
INSERT INTO AuditLog VALUES('cmmu72qto000yrqcg38f7r6r8',1773726692173,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','b57e73d68e991872f93f40531bb6dc9565f026396623753606bb1f92b0f2f890','2cbdada4d4fa26fd2269ebd6c605aa23e3bd688b76e0ae112f76c21cc776f90b');
INSERT INTO AuditLog VALUES('cmmu72wmn0016rqcgm3lnxyhd',1773726699689,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','19354cfe01b42a98471a43c85a41f9d2147ead7cfa704dae245332e7877e77ce','b57e73d68e991872f93f40531bb6dc9565f026396623753606bb1f92b0f2f890');
INSERT INTO AuditLog VALUES('cmmu72wru0018rqcg1crk9wu3',1773726699883,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','a665af91675a1ab45fefae262ceb2c08c2c4574be9d023eca4bf28be7fd913e5','19354cfe01b42a98471a43c85a41f9d2147ead7cfa704dae245332e7877e77ce');
INSERT INTO AuditLog VALUES('cmmu731zg001irqcgloulo01m',1773726706636,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','7f08088b1d175ddc64f8520a87e997ad4e9166bef03acaedf25b3699645d91a1','a665af91675a1ab45fefae262ceb2c08c2c4574be9d023eca4bf28be7fd913e5');
INSERT INTO AuditLog VALUES('cmmu731zc001erqcgfmiju4j4',1773726706633,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','9ecb61065d0571b3660c277954914b2966697ae2ddf583cf60d295098ad3b96d','a665af91675a1ab45fefae262ceb2c08c2c4574be9d023eca4bf28be7fd913e5');
INSERT INTO AuditLog VALUES('cmmu735nq001qrqcgohx6ucnk',1773726711398,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','8ff8534b0803aaa8290ae9e9fd393356b9494422a3921c544527fede5b00764a','7f08088b1d175ddc64f8520a87e997ad4e9166bef03acaedf25b3699645d91a1');
INSERT INTO AuditLog VALUES('cmmu735nr001srqcgun6zw0cy',1773726711398,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','1e68c1d287a5331919f3b8d3b9df776459a852fbf17ebd458c69c21f665b1b31','7f08088b1d175ddc64f8520a87e997ad4e9166bef03acaedf25b3699645d91a1');
INSERT INTO AuditLog VALUES('cmmu738ng001xrqcgerqby1af',1773726715276,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','a0a6af8ce34ecb6189c85bc41283f7330feecf4caa0c69db86bd1499786c8407','1e68c1d287a5331919f3b8d3b9df776459a852fbf17ebd458c69c21f665b1b31');
INSERT INTO AuditLog VALUES('cmmu73arj0022rqcg7dx66v29',1773726718016,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','4ccad36e8ca9f00b69e18f45141710a1a0a52d5822db39d6b140bcc5faf344a1','a0a6af8ce34ecb6189c85bc41283f7330feecf4caa0c69db86bd1499786c8407');
INSERT INTO AuditLog VALUES('cmmu740my0028rqcgqi4ax5vw',1773726751546,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','2602f4a90f81b35228278ae48654f449fa32968b9e330a3caefdb5531530c491','4ccad36e8ca9f00b69e18f45141710a1a0a52d5822db39d6b140bcc5faf344a1');
INSERT INTO AuditLog VALUES('cmmu740ro002frqcgdfa2b8gb',1773726751715,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','2c084f18007c164d3472fed543a94c3abd98555fc537751cf90323c842d4eb23','2602f4a90f81b35228278ae48654f449fa32968b9e330a3caefdb5531530c491');
INSERT INTO AuditLog VALUES('cmmu740u2002hrqcg2fiaacc4',1773726751801,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','3714e579594d125656454b9fd64fd130d9fdb9e94c2b1e36bb006f485b95c23b','2c084f18007c164d3472fed543a94c3abd98555fc537751cf90323c842d4eb23');
INSERT INTO AuditLog VALUES('cmmu741dg002mrqcgspds2wbj',1773726752500,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','c7f23a3eee233fe6675213f569002ac8feba938529652d238d6b9df1c7199384','3714e579594d125656454b9fd64fd130d9fdb9e94c2b1e36bb006f485b95c23b');
INSERT INTO AuditLog VALUES('cmmu744y7002rrqcg6zbpby5d',1773726757135,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','f26d8090104b09bcc41b11048c33e08b6709a5b9f08ff2f2afd5def387b89bb3','c7f23a3eee233fe6675213f569002ac8feba938529652d238d6b9df1c7199384');
INSERT INTO AuditLog VALUES('cmmu745lu002wrqcg5t8ibdxf',1773726757986,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','ae2dba2b5e0473ed786b32f848eae67f300d16ac34583bd7e6b16a8f89243b70','f26d8090104b09bcc41b11048c33e08b6709a5b9f08ff2f2afd5def387b89bb3');
INSERT INTO AuditLog VALUES('cmmu746ie0031rqcgu6wwoy7b',1773726759158,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','63c87de8a1943d493603de4e7bf9516f9789fa4ee8741d2015c5c0622e49078e','ae2dba2b5e0473ed786b32f848eae67f300d16ac34583bd7e6b16a8f89243b70');
INSERT INTO AuditLog VALUES('cmmu749a30036rqcgioc1ht9z',1773726762748,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','17201b4b35d37d17e310027c4b225c45c422164b2c1a21fc88f4e134aea29255','63c87de8a1943d493603de4e7bf9516f9789fa4ee8741d2015c5c0622e49078e');
INSERT INTO AuditLog VALUES('cmmu74a5l003brqcgj6ijzo82',1773726763881,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','df646a00f14e8d6fde1ba7236b12df1bcfd4dbbabba5dcd2b3cac0e1e2044303','17201b4b35d37d17e310027c4b225c45c422164b2c1a21fc88f4e134aea29255');
INSERT INTO AuditLog VALUES('cmmu74bdq003grqcg7g4refpm',1773726765471,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','53e7fa193b86880d9f97bef9d7eda9ceb3aa935da67ae54b9c3a8cf9479cd50c','df646a00f14e8d6fde1ba7236b12df1bcfd4dbbabba5dcd2b3cac0e1e2044303');
INSERT INTO AuditLog VALUES('cmmu74dnf003lrqcgenb2f7g2',1773726768412,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','6ca9ec1ba75fbefec37d83e1f46928290488ea48710be4ba97b260e4051d7e75','53e7fa193b86880d9f97bef9d7eda9ceb3aa935da67ae54b9c3a8cf9479cd50c');
INSERT INTO AuditLog VALUES('cmmu74f0k003qrqcgnda9civv',1773726770180,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','3cbff521ad75b9be49c40941fd6e64ab694d376c2502fd386a90b819751d888e','6ca9ec1ba75fbefec37d83e1f46928290488ea48710be4ba97b260e4051d7e75');
INSERT INTO AuditLog VALUES('cmmu74gw1003vrqcg9ptisecy',1773726772610,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','587446a6da0bda29a5057c86c6bc87b60f559a47a1e7dc9b85ce9527c9c7beaa','3cbff521ad75b9be49c40941fd6e64ab694d376c2502fd386a90b819751d888e');
INSERT INTO AuditLog VALUES('cmmu74jrz0040rqcgn0ot9vf1',1773726776351,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','3ec14feb7f355e80801834c21cbb3fde5a4a560f78d9e216c96b4b5b8ec0cc9b','587446a6da0bda29a5057c86c6bc87b60f559a47a1e7dc9b85ce9527c9c7beaa');
INSERT INTO AuditLog VALUES('cmmu75sas0045rqcgsustewh1',1773726834052,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','d29213a5405f4718058cee7b7695b190e350a8113143b687a1931c360ae534c5','3ec14feb7f355e80801834c21cbb3fde5a4a560f78d9e216c96b4b5b8ec0cc9b');
INSERT INTO AuditLog VALUES('cmmu766ee004erqcgk4fuzycp',1773726852326,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','bbdb2078f9bbc994523771493f9d1a852f61adb793c402f642942628675745f4','d29213a5405f4718058cee7b7695b190e350a8113143b687a1931c360ae534c5');
INSERT INTO AuditLog VALUES('cmmu766el004irqcg2ls1u3jq',1773726852333,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','961891b7fe13757a7aa545322d9c762e367ff67bb21e926bb57ff5d15ef2eca6','bbdb2078f9bbc994523771493f9d1a852f61adb793c402f642942628675745f4');
INSERT INTO AuditLog VALUES('cmmu766ex004krqcg3ytm7d25',1773726852345,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','db2d93e9f7356f91f11d92d2a8311d90f4424be635a21c27bfa37af7d4760fcd','bbdb2078f9bbc994523771493f9d1a852f61adb793c402f642942628675745f4');
INSERT INTO AuditLog VALUES('cmmu766s5004prqcgpmsqym97',1773726852822,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','948196defbeee560f199badbbf5f15cc046193d0477dcc368d8f45c0ba023915','db2d93e9f7356f91f11d92d2a8311d90f4424be635a21c27bfa37af7d4760fcd');
INSERT INTO AuditLog VALUES('cmmu76d1s004xrqcgn18q9etd',1773726860944,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','1bd4d6dbebf7f0a53bb887b6f1eb23e2e61a3dff57952952ebb098dcd1c59aec','948196defbeee560f199badbbf5f15cc046193d0477dcc368d8f45c0ba023915');
INSERT INTO AuditLog VALUES('cmmu76d28004zrqcg80481bb5',1773726860959,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','617e47a751a0dd3039a5a33b7157aa298ea20adff7582149610bbaee58bc1d68','948196defbeee560f199badbbf5f15cc046193d0477dcc368d8f45c0ba023915');
INSERT INTO AuditLog VALUES('cmmu76ier0057rqcgxlp0ssac',1773726867891,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','5d89fc6c83ac28c51763c326e80bd60dfd93147805b598a0126eb9e33596ac67','617e47a751a0dd3039a5a33b7157aa298ea20adff7582149610bbaee58bc1d68');
INSERT INTO AuditLog VALUES('cmmu76ifh0059rqcgsd3bkegc',1773726867917,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','97ee653aaeea56859c1dfed3df5d3f61792ae45209d235a93595eca9abb9ad95','5d89fc6c83ac28c51763c326e80bd60dfd93147805b598a0126eb9e33596ac67');
INSERT INTO AuditLog VALUES('cmmu76kvq005erqcgydb51jxt',1773726871095,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','160c815da4e599d8b25ea860226793cbde69b65e5bd91ceba523671e6fcd6175','97ee653aaeea56859c1dfed3df5d3f61792ae45209d235a93595eca9abb9ad95');
INSERT INTO AuditLog VALUES('cmmu76m0o005jrqcg08l5f6sg',1773726872569,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','ec853ec9b5f2488a5f462c4980b7e7afac553f8a4dd2d671d4c867d1c4c42d49','160c815da4e599d8b25ea860226793cbde69b65e5bd91ceba523671e6fcd6175');
INSERT INTO AuditLog VALUES('cmmu76pez005orqcg09666vtf',1773726876963,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','87b02a7e60f41ef0282425faa49036355dbf28560d9433aa9d301e45e3ab57c8','ec853ec9b5f2488a5f462c4980b7e7afac553f8a4dd2d671d4c867d1c4c42d49');
INSERT INTO AuditLog VALUES('cmmu76phw005trqcg4a4du8v9',1773726877076,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','f576cfc4a870e14b9565f43c287955384cc7f86927d77bfb1a8873f38aaf5619','87b02a7e60f41ef0282425faa49036355dbf28560d9433aa9d301e45e3ab57c8');
INSERT INTO AuditLog VALUES('cmmu78p83005yrqcgz6f67box',1773726970035,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','e85491095cada494b368d1f0ad1847f037bac730f19093c69456822301ed81d2','f576cfc4a870e14b9565f43c287955384cc7f86927d77bfb1a8873f38aaf5619');
INSERT INTO AuditLog VALUES('cmmu78qv10066rqcgttfbvw9c',1773726972157,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','73c55ca16893bde320f32cf91b968f7120299284785e3fb60307e8983038699a','e85491095cada494b368d1f0ad1847f037bac730f19093c69456822301ed81d2');
INSERT INTO AuditLog VALUES('cmmu78qv20068rqcgrl6vfg2t',1773726972158,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','9b6c0ee9b75ae14fd671b72ab3ea1fc81f585cc51643569203d2c421fb916c4d','e85491095cada494b368d1f0ad1847f037bac730f19093c69456822301ed81d2');
INSERT INTO AuditLog VALUES('cmmu78r4s006drqcgpkpnjdqx',1773726972508,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','a36549f94b87c4f144c356e0e018dae42d3208715c0078715e66253fb1a7ec6b','9b6c0ee9b75ae14fd671b72ab3ea1fc81f585cc51643569203d2c421fb916c4d');
INSERT INTO AuditLog VALUES('cmmu78uej006irqcgpa11ikii',1773726976748,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','487cb25f63c1d423b68c4de5b69c46329c6222c8ca043ef7d26bb8c1682bf65f','a36549f94b87c4f144c356e0e018dae42d3208715c0078715e66253fb1a7ec6b');
INSERT INTO AuditLog VALUES('cmmu78va8006nrqcgwibyf1oc',1773726977888,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','f59c51532706c1ab0bd1e3ea09f3c127187923db45bc1c969b3ba3467a67f9e1','487cb25f63c1d423b68c4de5b69c46329c6222c8ca043ef7d26bb8c1682bf65f');
INSERT INTO AuditLog VALUES('cmmu78y6n006srqcgamekepq2',1773726981648,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','18ffb0444d5b79618f92509737c59a816cfe52400bd36ff47e2e69ff4f76fea7','f59c51532706c1ab0bd1e3ea09f3c127187923db45bc1c969b3ba3467a67f9e1');
INSERT INTO AuditLog VALUES('cmmu790nc006xrqcgnivgj5ox',1773726984840,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','99c3288a1c445e76616ecb7f8325f25144f2ca6d0f0d908be0d28a4578de369c','18ffb0444d5b79618f92509737c59a816cfe52400bd36ff47e2e69ff4f76fea7');
INSERT INTO AuditLog VALUES('cmmu7916h0072rqcgzicu9jwv',1773726985529,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','86aae4b0eb89589df6aa0b0e3f8c7dec538db48e215b89f87f11fc57b41769cc','99c3288a1c445e76616ecb7f8325f25144f2ca6d0f0d908be0d28a4578de369c');
INSERT INTO AuditLog VALUES('cmmu792zw0077rqcg4bkfuwbr',1773726987885,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','c6644470df9d1aacc8242a7f9f3a438ddae6877591616f826e176bca5d317e40','86aae4b0eb89589df6aa0b0e3f8c7dec538db48e215b89f87f11fc57b41769cc');
INSERT INTO AuditLog VALUES('cmmu794x4007crqcgncb8l5ni',1773726990377,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','3b02f6c2561ac2c215dfde2f41c98f61cda886acb775bf3b3958b746e60d954a','c6644470df9d1aacc8242a7f9f3a438ddae6877591616f826e176bca5d317e40');
INSERT INTO AuditLog VALUES('cmmu79711007hrqcgmg30gj80',1773726993110,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','9d1d4a9f93c339605f3b84ccef34aa338a8c4c00a2722035d01ca226808f71c5','3b02f6c2561ac2c215dfde2f41c98f61cda886acb775bf3b3958b746e60d954a');
INSERT INTO AuditLog VALUES('cmmu7971x007mrqcg25br03vc',1773726993141,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','8c28a6dfc0758f7ac5257c6c01673da9ad4ded7e69de7aaa32cebc937d010fb0','9d1d4a9f93c339605f3b84ccef34aa338a8c4c00a2722035d01ca226808f71c5');
INSERT INTO AuditLog VALUES('cmmu799eb007rrqcg6x8jpa61',1773726996179,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','86b71ec56a3a0ee74b5a431fb630ad20658b63c9354a2cda26ba9d0c405c1f46','8c28a6dfc0758f7ac5257c6c01673da9ad4ded7e69de7aaa32cebc937d010fb0');
INSERT INTO AuditLog VALUES('cmmu79bek007wrqcg40h1dltu',1773726998780,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','1316c49c7365463677eb61c6a245d65eccbd22e1ff62259fbf6cbb8ddb3c06aa','86b71ec56a3a0ee74b5a431fb630ad20658b63c9354a2cda26ba9d0c405c1f46');
INSERT INTO AuditLog VALUES('cmmu79dj40081rqcgblyd6nt7',1773727001537,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','1ec420dbe7d13fe8bb96af4544cc8c472513148e1b003f331f38c7a63a9040ab','1316c49c7365463677eb61c6a245d65eccbd22e1ff62259fbf6cbb8ddb3c06aa');
INSERT INTO AuditLog VALUES('cmmu79ego0086rqcgqd7hugka',1773727002745,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','bcb15fb15f54aae18fb40762ceedafe301fc54702b0beb82017cdb416eaa0806','1ec420dbe7d13fe8bb96af4544cc8c472513148e1b003f331f38c7a63a9040ab');
INSERT INTO AuditLog VALUES('cmmu79h0t008brqcgi3jpb4ne',1773727006061,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','6179f7934475a97928e5bb71585820d141d0115ed444a1396b3189dd23e26827','bcb15fb15f54aae18fb40762ceedafe301fc54702b0beb82017cdb416eaa0806');
INSERT INTO AuditLog VALUES('cmmu79isw008grqcgez80kgrq',1773727008368,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','6c92a70cc82c465d56b59bc3d9490d45f17250bd813005d526bc40c76ca39991','6179f7934475a97928e5bb71585820d141d0115ed444a1396b3189dd23e26827');
INSERT INTO AuditLog VALUES('cmmu79lhj008lrqcg8k3b0s3l',1773727011847,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','686783703ffbf09af815f9e17ee077b423d79d5c6006c7f4a067f3264f35b140','6c92a70cc82c465d56b59bc3d9490d45f17250bd813005d526bc40c76ca39991');
INSERT INTO AuditLog VALUES('cmmu79no3008qrqcg4wx7qhv4',1773727014676,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','20e4138ab57dd6aa2560b52c5666ba065d6cee3a307e16bb59a353eada0580ba','686783703ffbf09af815f9e17ee077b423d79d5c6006c7f4a067f3264f35b140');
INSERT INTO AuditLog VALUES('cmmu7aht1008vrqcgwr23h4pp',1773727053734,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','2ef3a73090bcb13baa1d719dc3a30ba0b1018ae8e9ce47540840077359a67480','20e4138ab57dd6aa2560b52c5666ba065d6cee3a307e16bb59a353eada0580ba');
INSERT INTO AuditLog VALUES('cmmu7ais90090rqcgby6ixvtg',1773727055002,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','c97b9e619e3b0c1d04d56e8a3fd0327e76d8433e0860f5867e18278180780086','2ef3a73090bcb13baa1d719dc3a30ba0b1018ae8e9ce47540840077359a67480');
INSERT INTO AuditLog VALUES('cmmu7amfb0095rqcgngn6st6s',1773727059719,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','f714a6c01ef3104077092c77f5a1e5665cfa4ab0f64342e92dd1d66c2d829090','c97b9e619e3b0c1d04d56e8a3fd0327e76d8433e0860f5867e18278180780086');
INSERT INTO AuditLog VALUES('cmmu7ao5s009brqcgfya3i2qh',1773727061968,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','6716d0cd2deddeb8075609e85dd101698473a89c983762ce1fb34733f2d928e5','f714a6c01ef3104077092c77f5a1e5665cfa4ab0f64342e92dd1d66c2d829090');
INSERT INTO AuditLog VALUES('cmmu7aoad009frqcgfv600de8',1773727062133,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','5ea1bed8867d5df165f1467e5eeb8adb268d84e4c529013007d0c8ccf3ca8b05','6716d0cd2deddeb8075609e85dd101698473a89c983762ce1fb34733f2d928e5');
INSERT INTO AuditLog VALUES('cmmu7arzr009krqcg58tbd8hd',1773727066935,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','6c99603a91cad9d103a0306b1764a2462c2fdaa4ceb17c2266f3269eb6166998','5ea1bed8867d5df165f1467e5eeb8adb268d84e4c529013007d0c8ccf3ca8b05');
INSERT INTO AuditLog VALUES('cmmu7atfl009prqcggr0ochi2',1773727068801,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','a615b2730924aa606b3350272baa37f51d67a77d92122fd4188bd3eedff84840','6c99603a91cad9d103a0306b1764a2462c2fdaa4ceb17c2266f3269eb6166998');
INSERT INTO AuditLog VALUES('cmmu7aw74009xrqcgbzgmgw7g',1773727072384,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','6a67fa0ca949cd8343b76d22c95e77b8fb4b0d4397041f925e5b00aea5607540','a615b2730924aa606b3350272baa37f51d67a77d92122fd4188bd3eedff84840');
INSERT INTO AuditLog VALUES('cmmu7aw79009zrqcg7vkzi1p9',1773727072389,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','b6c4a84771af707fefd8ed6c72449c4bc6769074b595a066aabb71d66220706e','a615b2730924aa606b3350272baa37f51d67a77d92122fd4188bd3eedff84840');
INSERT INTO AuditLog VALUES('cmmu7b12100a4rqcg3kyphre5',1773727078681,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','7070e530bc9a60a1e9c1a5a7930c37245f2eb44feb554d66fa23f078a35d7bfa','b6c4a84771af707fefd8ed6c72449c4bc6769074b595a066aabb71d66220706e');
INSERT INTO AuditLog VALUES('cmmu7d51p00a9rqcghkhjsbsv',1773727177166,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','9d2b0e430f3a2f7df76ca76b1750506396c968a57ebda0eb66c3e6efae7cc40b','7070e530bc9a60a1e9c1a5a7930c37245f2eb44feb554d66fa23f078a35d7bfa');
INSERT INTO AuditLog VALUES('cmmu7dcis00aerqcgw153tixz',1773727186852,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','ef933a6743c85f863ac54a1d25d819f02509c16e5a4399a1a738987c6a63cb28','9d2b0e430f3a2f7df76ca76b1750506396c968a57ebda0eb66c3e6efae7cc40b');
INSERT INTO AuditLog VALUES('cmmu7djt500ajrqcgwzqer7ct',1773727196298,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','2acf73f8f99c9dd0b184418eb0ca98e38f04531e51fb5a04d0e0cdcd932b988b','ef933a6743c85f863ac54a1d25d819f02509c16e5a4399a1a738987c6a63cb28');
INSERT INTO AuditLog VALUES('cmmu7e03i00aurqcgp8eu0sq9',1773727217407,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','33856300dfa0b4cf4ac0d48edc13ba9f64d88421f8f3b9ccb1ad0a0549beb71f','2acf73f8f99c9dd0b184418eb0ca98e38f04531e51fb5a04d0e0cdcd932b988b');
INSERT INTO AuditLog VALUES('cmmu7e0xp00awrqcghogppwqw',1773727218493,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','29e1fe054890e09a362c646d451ee0d6173960b91820ce7e6e524b4e347fa7f7','33856300dfa0b4cf4ac0d48edc13ba9f64d88421f8f3b9ccb1ad0a0549beb71f');
INSERT INTO AuditLog VALUES('cmmu7e0yo00ayrqcgw4a40med',1773727218496,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','14b6e5a2952f5c106b4ab0977261f23790083dcad617a9213ca5761aed10d866','33856300dfa0b4cf4ac0d48edc13ba9f64d88421f8f3b9ccb1ad0a0549beb71f');
INSERT INTO AuditLog VALUES('cmmu7ejhk00b3rqcgcj9qxps1',1773727242536,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','ffb43e876e141a35fbb8e8d3a64e8e339e583523d32b6d59559f477fc3743d11','14b6e5a2952f5c106b4ab0977261f23790083dcad617a9213ca5761aed10d866');
INSERT INTO AuditLog VALUES('cmmu7ejlo00b8rqcg3k2dkt3g',1773727242684,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','af00dbb0d7c1d6fdb3178373bbbc94bea1127d29f93021abd8fa889e2d88f142','ffb43e876e141a35fbb8e8d3a64e8e339e583523d32b6d59559f477fc3743d11');
INSERT INTO AuditLog VALUES('cmmu7eljl00bdrqcgcbh4hopz',1773727245201,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','2585e471bf924954c70d6f5fa3c923fe91b16a64160c708ca97f856ac236fc4f','af00dbb0d7c1d6fdb3178373bbbc94bea1127d29f93021abd8fa889e2d88f142');
INSERT INTO AuditLog VALUES('cmmu7en8s00birqcg7s4tffaq',1773727247405,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','70ecb7e9d85672e320206fdd74a7333e27489c0494b5943690f381fea98777cd','2585e471bf924954c70d6f5fa3c923fe91b16a64160c708ca97f856ac236fc4f');
INSERT INTO AuditLog VALUES('cmmu7eove00bnrqcgomdht08p',1773727249515,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','54b562576f025dc9592d04dc2ba5ee207e25d2588edc27b1501e389b5cf65620','70ecb7e9d85672e320206fdd74a7333e27489c0494b5943690f381fea98777cd');
INSERT INTO AuditLog VALUES('cmmu7erz800bsrqcgnx5qjnkl',1773727253540,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','b8ee3849088ce0bfad651f82a678f481fdd9919ecb017e49d60ee5c8a6dc7cb3','54b562576f025dc9592d04dc2ba5ee207e25d2588edc27b1501e389b5cf65620');
INSERT INTO AuditLog VALUES('cmmu7expk00byrqcgmiflgsjl',1773727260969,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','c5a542f99c32cac36052c433a84214e815f109b229febc408561b0ac4245765f','b8ee3849088ce0bfad651f82a678f481fdd9919ecb017e49d60ee5c8a6dc7cb3');
INSERT INTO AuditLog VALUES('cmmu7extu00c2rqcgtgu3tqmd',1773727261122,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','1e9adb6f090cf2906b342f4bccd8f14e8696836d3c443fbab015ff20dd05662e','b8ee3849088ce0bfad651f82a678f481fdd9919ecb017e49d60ee5c8a6dc7cb3');
INSERT INTO AuditLog VALUES('cmmu7f9cr00carqcgppmkv7i9',1773727276060,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','268ee1e2061f1ddf79f3af460e444ede2be2a8a9c037c946d9270d419bb9f9cf','1e9adb6f090cf2906b342f4bccd8f14e8696836d3c443fbab015ff20dd05662e');
INSERT INTO AuditLog VALUES('cmmu7f9fp00ccrqcgyc0nqdx2',1773727276165,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','95e7547179abf7b7c96ff15e2d4cc1258a6f257b9383382a96136a7454b3f1df','268ee1e2061f1ddf79f3af460e444ede2be2a8a9c037c946d9270d419bb9f9cf');
INSERT INTO AuditLog VALUES('cmmu7fl4k00cirqcgygwm7grs',1773727291317,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','c1bbda7131c3e2380ed1eaff147721a2f8d79e04899173933474868b3bbd9c80','95e7547179abf7b7c96ff15e2d4cc1258a6f257b9383382a96136a7454b3f1df');
INSERT INTO AuditLog VALUES('cmmu7fl5i00cnrqcgxpy7tr7b',1773727291350,'cmmnqsfld000103yp3d86suci','LOGIN','SECURITY','cmmnqsfld000103yp3d86suci','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','462753d66b88894797c22848afb75bea0decd6d500e69ef61408a03dd58f6d97','c1bbda7131c3e2380ed1eaff147721a2f8d79e04899173933474868b3bbd9c80');
INSERT INTO AuditLog VALUES('cmmu7fl7300crrqcgc80559m9',1773727291405,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','d1cff224c5dc4ecbe263e63a0d7cf3fc88d68a84ebedefb0a2a94fc527f7bfac','462753d66b88894797c22848afb75bea0decd6d500e69ef61408a03dd58f6d97');
INSERT INTO AuditLog VALUES('cmmu7fnfy00cxrqcgldgw2yqz',1773727294318,'cmmnqsfld000103yp3d86suci','LOGIN','SECURITY','cmmnqsfld000103yp3d86suci','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','3b771baba8aadd439f293f24ab6e254a8507b78ae758d7be0442e58bd26af731','d1cff224c5dc4ecbe263e63a0d7cf3fc88d68a84ebedefb0a2a94fc527f7bfac');
INSERT INTO AuditLog VALUES('cmmu7fp5p00d2rqcgrwhkrl9k',1773727296541,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','d7909c3021803e3a2bd1c722c2c9fc60b705dd3f64c1b98f4f249e304c4b1ca3','3b771baba8aadd439f293f24ab6e254a8507b78ae758d7be0442e58bd26af731');
INSERT INTO AuditLog VALUES('cmmu7fqhy00d7rqcgpxi183gf',1773727298279,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','04b80feaba031c9ae6ca75143f608a27a3d884d84ab2261236e8c1cce84fb841','d7909c3021803e3a2bd1c722c2c9fc60b705dd3f64c1b98f4f249e304c4b1ca3');
INSERT INTO AuditLog VALUES('cmmu7fsgx00dcrqcga8lw9mls',1773727300833,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','11e58247a47eb2c0c2631acb8aa51c98e7937ee5348b29ec624574d1ed7faf25','04b80feaba031c9ae6ca75143f608a27a3d884d84ab2261236e8c1cce84fb841');
INSERT INTO AuditLog VALUES('cmmu7fu8p00dhrqcg4s246qq6',1773727303129,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','46497fbb1732fd1e8b79f7954115ef6e271bb21291e6b65df6955b7803a562e2','11e58247a47eb2c0c2631acb8aa51c98e7937ee5348b29ec624574d1ed7faf25');
INSERT INTO AuditLog VALUES('cmmu7fvyk00dmrqcgq9tk3ug5',1773727305357,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','fbcb73d54ae22af1c5fdc8918bce38c3c8d0a6508cb592a8b9a906578dec5704','46497fbb1732fd1e8b79f7954115ef6e271bb21291e6b65df6955b7803a562e2');
INSERT INTO AuditLog VALUES('cmmu7glpg00drrqcgu8if4pne',1773727338725,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','c8005ed6de6b8f5f6f23e9983161b9a4fc56241881c3b4907bf6ea03e8e90e80','fbcb73d54ae22af1c5fdc8918bce38c3c8d0a6508cb592a8b9a906578dec5704');
INSERT INTO AuditLog VALUES('cmmu7gmyo00dwrqcgjqasnqxm',1773727340353,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','9144c19a90b137cf3990bf759389c93200bb2c7e61fdbd43d92ef61de4fdc43a','c8005ed6de6b8f5f6f23e9983161b9a4fc56241881c3b4907bf6ea03e8e90e80');
INSERT INTO AuditLog VALUES('cmmu7go7j00e1rqcg5m91zdzn',1773727341967,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','29afeac284ec1ca8052c78893d4095a77db3d0cf2d745ab4e24adc9820e72bb0','9144c19a90b137cf3990bf759389c93200bb2c7e61fdbd43d92ef61de4fdc43a');
INSERT INTO AuditLog VALUES('cmmu7gpez00e6rqcgl5bzrhci',1773727343532,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','05de07df26fa09f308ae8eb142c98d9d410b6f13693ba83c2c7d907f155eba87','29afeac284ec1ca8052c78893d4095a77db3d0cf2d745ab4e24adc9820e72bb0');
INSERT INTO AuditLog VALUES('cmmu7gprz00ebrqcgj6w9chgv',1773727344000,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','20249ec79ab6066c3d766ede4912ec23a0dbecf999def67027c97037dd3d8ef6','05de07df26fa09f308ae8eb142c98d9d410b6f13693ba83c2c7d907f155eba87');
INSERT INTO AuditLog VALUES('cmmu7gq3z00egrqcgnnfii3vm',1773727344431,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','449cabd302544b209ed261e61413d844f92e4c618a0ee6d34f6dd71079318dad','20249ec79ab6066c3d766ede4912ec23a0dbecf999def67027c97037dd3d8ef6');
INSERT INTO AuditLog VALUES('cmmu7grde00elrqcgex0fbf8b',1773727346066,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0.1) Gecko/20100101 Firefox/146.0.1','ab07d8d032e56bac5eba5f4e6bd5790db08bbd111fbfc4d4311025e7c06fd0fb','449cabd302544b209ed261e61413d844f92e4c618a0ee6d34f6dd71079318dad');
INSERT INTO AuditLog VALUES('cmmu7gtnu00eqrqcgyb4dxjkb',1773727349035,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0.1) Gecko/20100101 Firefox/146.0.1','6186d7d69592e798599e4bad271c45ccd228ddfd96928b42ad9b975677230344','ab07d8d032e56bac5eba5f4e6bd5790db08bbd111fbfc4d4311025e7c06fd0fb');
INSERT INTO AuditLog VALUES('cmmu7gwrv00ewrqcgo99cn2t1',1773727353065,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','15199d1e0c66303265974c7ac25ba9f84306e7788eccc01803ccf4a51f7f50a2','6186d7d69592e798599e4bad271c45ccd228ddfd96928b42ad9b975677230344');
INSERT INTO AuditLog VALUES('cmmu7gwxa00f0rqcgrqpv171p',1773727353262,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','4e031d57abc9f1ac1add1346e7311633c090874a009f9b4c118bf168f9a7356e','15199d1e0c66303265974c7ac25ba9f84306e7788eccc01803ccf4a51f7f50a2');
INSERT INTO AuditLog VALUES('cmmu7h4i300f5rqcg5kbn83vk',1773727363083,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0.1) Gecko/20100101 Firefox/146.0.1','f346c6a8bf0da535058022f2d6c4066a6ab64ee231cdd767c09a7bda70580ac1','4e031d57abc9f1ac1add1346e7311633c090874a009f9b4c118bf168f9a7356e');
INSERT INTO AuditLog VALUES('cmmu7h6i600farqcgnqtuoina',1773727365679,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0.1) Gecko/20100101 Firefox/146.0.1','e3476b07ecf8a83dc59c3ef858d9a9d5589dac7e2faacc41bce0d93d18a6717b','f346c6a8bf0da535058022f2d6c4066a6ab64ee231cdd767c09a7bda70580ac1');
INSERT INTO AuditLog VALUES('cmmu7h6uu00ffrqcgkod9bdz5',1773727366134,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0.1) Gecko/20100101 Firefox/146.0.1','fcecd62904f9a7690fe246503528c04580df9fc4497d72099f7195220868829c','e3476b07ecf8a83dc59c3ef858d9a9d5589dac7e2faacc41bce0d93d18a6717b');
INSERT INTO AuditLog VALUES('cmmu7hjrr00fkrqcgfwc9cu6m',1773727382872,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','154756dd64bc00ce8475241814a02f63a38510a9ea4e55f121c9525a5470484d','fcecd62904f9a7690fe246503528c04580df9fc4497d72099f7195220868829c');
INSERT INTO AuditLog VALUES('cmmu7hmyn00fprqcglnugrc34',1773727387008,'cmmnqsfld000203yp9v7ir4ts','LOGIN','SECURITY','cmmnqsfld000203yp9v7ir4ts','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','18330b730e85fbdcc5bcb5710fb7754a9caeba53de50ffa4511e315cd6e02aad','154756dd64bc00ce8475241814a02f63a38510a9ea4e55f121c9525a5470484d');
INSERT INTO AuditLog VALUES('cmmu7hnn500furqcglus0s6m7',1773727387890,'cmmnqsfld000103yp3d86suci','LOGIN','SECURITY','cmmnqsfld000103yp3d86suci','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','9a1f6ddb13fb274542dc131b2a7e2127e4ee3975d7c3bfa53635beb27a94ee39','18330b730e85fbdcc5bcb5710fb7754a9caeba53de50ffa4511e315cd6e02aad');
INSERT INTO AuditLog VALUES('cmmu7hrz400fzrqcgwq7w01yo',1773727393504,'cmmnqsfle000303yp8iavv5sw','LOGIN','SECURITY','cmmnqsfle000303yp8iavv5sw','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','e96f19e0cea2808d196fb3618b9c4840d22d377ee60b7b5bfe73794f6cf8b36d','9a1f6ddb13fb274542dc131b2a7e2127e4ee3975d7c3bfa53635beb27a94ee39');
INSERT INTO AuditLog VALUES('cmmu7j0ia00g4rqcgs9sq5xz7',1773727451206,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','d46a60ca5a0e39ceae28510f362bc6875864b7fbc50ce3717167793d9c88c4c6','e96f19e0cea2808d196fb3618b9c4840d22d377ee60b7b5bfe73794f6cf8b36d');
INSERT INTO AuditLog VALUES('cmmu7j0ka00gbrqcg3pocdp5u',1773727451284,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','1811d08bb209a856816e223522f86f9952a955624c0c4399b6951e0408fd3f71','d46a60ca5a0e39ceae28510f362bc6875864b7fbc50ce3717167793d9c88c4c6');
INSERT INTO AuditLog VALUES('cmmu7j0mj00gfrqcggtlil5xx',1773727451372,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','62b3a6bbec58daf919be4eca109c01cc445a91c1bf69ac247b2525a9db21f7ce','1811d08bb209a856816e223522f86f9952a955624c0c4399b6951e0408fd3f71');
INSERT INTO AuditLog VALUES('cmmu7j0vt00gjrqcgoo8ba7ve',1773727451705,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','8c3f0a34021357a4cb44428faf8ef8bbef185bd3ee91965bfed567d0837f4e41','62b3a6bbec58daf919be4eca109c01cc445a91c1bf69ac247b2525a9db21f7ce');
INSERT INTO AuditLog VALUES('cmmu7j4ml00gorqcgp8c1jmqh',1773727456468,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','6ccae4fa7f709e609bd48defe96854199638d3c2ce2800bcde097fd9615a625f','8c3f0a34021357a4cb44428faf8ef8bbef185bd3ee91965bfed567d0837f4e41');
INSERT INTO AuditLog VALUES('cmmu7j6bi00gtrqcg0e1eguny',1773727458750,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','fc3d5db25dcee6690ef0fba832b7efb245f534f15b52f6742e9f1860a472fb1c','6ccae4fa7f709e609bd48defe96854199638d3c2ce2800bcde097fd9615a625f');
INSERT INTO AuditLog VALUES('cmmu7j6hp00gyrqcgc3u60dlz',1773727458974,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','29e14523ffb349ddd9a73f471364fb376e3a812952c658457720f22f8e857e5c','fc3d5db25dcee6690ef0fba832b7efb245f534f15b52f6742e9f1860a472fb1c');
INSERT INTO AuditLog VALUES('cmmu7ja6x00h3rqcg46zlzyr3',1773727463769,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','73b325f6e719c5041658f704016632a4e71028e5d79479f3d2ae50e0ade0125c','29e14523ffb349ddd9a73f471364fb376e3a812952c658457720f22f8e857e5c');
INSERT INTO AuditLog VALUES('cmmu7jdwa00h9rqcgddvjrdsn',1773727468571,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','8fa29c576244cac1374a75db64c5b78f732f2219787ed29f0cc18526c476e854','73b325f6e719c5041658f704016632a4e71028e5d79479f3d2ae50e0ade0125c');
INSERT INTO AuditLog VALUES('cmmu7jdwe00hdrqcgt9b7o6ll',1773727468575,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','4191f37b5e68d6190930246d18fa5248fba17c705b4059dbcca9cc33a86f1d80','73b325f6e719c5041658f704016632a4e71028e5d79479f3d2ae50e0ade0125c');
INSERT INTO AuditLog VALUES('cmmu7kupe00hirqcgc43aay9r',1773727537011,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','43c48dce08b6ec7ff9d96a45b9feb4de70ad33bb9baa88ba13093f414b3108d9','4191f37b5e68d6190930246d18fa5248fba17c705b4059dbcca9cc33a86f1d80');
INSERT INTO AuditLog VALUES('cmmu7l0gq00hnrqcg8va8ggkt',1773727544474,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','52b07b8f4a8db2a4cc6c88ce4ef18a47ecdfac17b8e02b3f4ed1db22579d7c9f','43c48dce08b6ec7ff9d96a45b9feb4de70ad33bb9baa88ba13093f414b3108d9');
INSERT INTO AuditLog VALUES('cmmu7mj3300hsrqcg02g54g46',1773727615264,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/145.0.7632.6 Safari/537.36','2a2a8808f81f19f232dbcfe42ad770476db36f10dc2c0aab2b219e317b9f5757','52b07b8f4a8db2a4cc6c88ce4ef18a47ecdfac17b8e02b3f4ed1db22579d7c9f');
INSERT INTO AuditLog VALUES('cmmu7owg000hxrqcg3xsbcglh',1773727725888,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/145.0.7632.6 Safari/537.36','ac089f3206008977e423ad7dcb637095976365847453a7823636df1338d3d468','2a2a8808f81f19f232dbcfe42ad770476db36f10dc2c0aab2b219e317b9f5757');
INSERT INTO AuditLog VALUES('cmmu7qc9500i2rqcgq5pl0ovj',1773727793034,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/145.0.7632.6 Safari/537.36','e8234c96a09f01409a7985de14e1300f75ab66cb644556d37ba2abcf3ae77a46','ac089f3206008977e423ad7dcb637095976365847453a7823636df1338d3d468');
INSERT INTO AuditLog VALUES('cmmu7rnh900i7rqcgkvy7kwlm',1773727854237,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/145.0.7632.6 Safari/537.36','f87c397dd0b7ab893eb3dc75cc439d80b9104178f77c3cd9fbcae7ac06c327e3','e8234c96a09f01409a7985de14e1300f75ab66cb644556d37ba2abcf3ae77a46');
INSERT INTO AuditLog VALUES('cmmu7trc000icrqcgirn6r5p5',1773727952545,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/145.0.7632.6 Safari/537.36','f97eadad53b01779f8cccbd4126fb481a4e6e6ae3077af97ad83194ed1f342ef','f87c397dd0b7ab893eb3dc75cc439d80b9104178f77c3cd9fbcae7ac06c327e3');
INSERT INTO AuditLog VALUES('cmmu7war600ihrqcgjkjty8ik',1773728071026,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/145.0.7632.6 Safari/537.36','9216fc4225a6a828d19c4274db2374bead35a1ad4fd92a5aad051a81bb5eb2b6','f97eadad53b01779f8cccbd4126fb481a4e6e6ae3077af97ad83194ed1f342ef');
INSERT INTO AuditLog VALUES('cmmu88x7m0004rqd8p153814c',1773728660002,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','::1','curl/8.7.1','b2e09ef9b385163fe1cf15d73dc44704dad1c9bd9a468ee7f8db1efb35378355','9216fc4225a6a828d19c4274db2374bead35a1ad4fd92a5aad051a81bb5eb2b6');
INSERT INTO AuditLog VALUES('cmmu8usl60004rqfcd5lb5dby',1773729680442,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','::1','curl/8.7.1','a9768832cc5d4f27b0db0e9f8b9193372fd32fe2b9e98ead13639beb5238e230','b2e09ef9b385163fe1cf15d73dc44704dad1c9bd9a468ee7f8db1efb35378355');
INSERT INTO AuditLog VALUES('cmmu94x7k0004rq2ilheah813',1773730152993,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','f23c501528de2f975dfadf56898d24f4d55c5c12a4038d7ebde3a45604a2d27d','a9768832cc5d4f27b0db0e9f8b9193372fd32fe2b9e98ead13639beb5238e230');
INSERT INTO AuditLog VALUES('cmmu954x20009rq2iv2q0j1yg',1773730162983,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','f61a8bafa3b1fec3f5231b6494cf3253b2d34eda8a0b559e9eb506b1a8440c3e','f23c501528de2f975dfadf56898d24f4d55c5c12a4038d7ebde3a45604a2d27d');
INSERT INTO AuditLog VALUES('cmmu96n7x0004rq6bm4los7k0',1773730233357,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','c885d38ad6f0d4ae54c3b84fa89b0d9cf04443f4a4827fedf268df0a66456002','f61a8bafa3b1fec3f5231b6494cf3253b2d34eda8a0b559e9eb506b1a8440c3e');
INSERT INTO AuditLog VALUES('cmmu96tkf0009rq6bf3p43n4s',1773730241583,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','a107895abdf74147fe6a5c1f00a80eb3826c0eb1073fcd6e47e68db29000a80e','c885d38ad6f0d4ae54c3b84fa89b0d9cf04443f4a4827fedf268df0a66456002');
INSERT INTO AuditLog VALUES('cmmu974yx000erq6br8g7pyzr',1773730256361,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','bc4989ef10c658b589e94f9d0431141bb8553cb3687de448b77dcd35bff3a205','a107895abdf74147fe6a5c1f00a80eb3826c0eb1073fcd6e47e68db29000a80e');
INSERT INTO AuditLog VALUES('cmmu98bhg000jrq6b019ezxca',1773730311461,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','b5a61dd2b9d7df8ce463d1c0cecb2ad7f78ffa349e25a07c6584398d73eb566c','bc4989ef10c658b589e94f9d0431141bb8553cb3687de448b77dcd35bff3a205');
INSERT INTO AuditLog VALUES('cmmu98bif000orq6bagwnbbn3',1773730311496,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','dca4b481d8becdc74a2ded05564b72844fa49f70c4e2a2edd7ef56516ea2f9b6','b5a61dd2b9d7df8ce463d1c0cecb2ad7f78ffa349e25a07c6584398d73eb566c');
INSERT INTO AuditLog VALUES('cmmu98bnq000urq6but5hdke4',1773730311686,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','16dcf8e5f9ae14d2533897a3113f7f67edf01133ff1222c0656fd3c5c249f3a0','dca4b481d8becdc74a2ded05564b72844fa49f70c4e2a2edd7ef56516ea2f9b6');
INSERT INTO AuditLog VALUES('cmmu98bo3000yrq6b942iy46p',1773730311698,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','900b700fa048086ec1ed610a257156b0f8c4807a375ade1ec3c244fd96c95c19','16dcf8e5f9ae14d2533897a3113f7f67edf01133ff1222c0656fd3c5c249f3a0');
INSERT INTO AuditLog VALUES('cmmu98ojg0017rq6b2gcra8rc',1773730328381,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','42c8d33168c270766714dcb34a70a4f7ece09b86464280b8672d9d8eb0d983e2','900b700fa048086ec1ed610a257156b0f8c4807a375ade1ec3c244fd96c95c19');
INSERT INTO AuditLog VALUES('cmmu98oji001brq6bjcl1fnbx',1773730328382,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','fe9bc952ec978f8202db4e8200bb3d3561c337b513634729e2505e8305939aaf','900b700fa048086ec1ed610a257156b0f8c4807a375ade1ec3c244fd96c95c19');
INSERT INTO AuditLog VALUES('cmmu98ooq001erq6bctvtex71',1773730328570,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','75eac29e624303e0598a781401c72a0ca42c9ebde1d154db02be8c2c57817b74','fe9bc952ec978f8202db4e8200bb3d3561c337b513634729e2505e8305939aaf');
INSERT INTO AuditLog VALUES('cmmu98ot0001irq6but6f9a7t',1773730328725,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','bdb5723906cbb010d301d51eb31f4a8a800b0c96bbd5b44a14b067a1c1ead356','75eac29e624303e0598a781401c72a0ca42c9ebde1d154db02be8c2c57817b74');
INSERT INTO AuditLog VALUES('cmmu98vnn001rrq6baxc0tm9r',1773730337603,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','21d399a5b3583626b0b68b68a784aba96e1045c8f859ae7d0c2fb76daa9b0cef','bdb5723906cbb010d301d51eb31f4a8a800b0c96bbd5b44a14b067a1c1ead356');
INSERT INTO AuditLog VALUES('cmmu98vnu001trq6by6pf7lhm',1773730337611,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','e5c8208a65a9e1a26205dc0195bdf17882ef1c9debdca03ed6c013a05a40e45c','21d399a5b3583626b0b68b68a784aba96e1045c8f859ae7d0c2fb76daa9b0cef');
INSERT INTO AuditLog VALUES('cmmu98vxz001xrq6buwld6gsm',1773730337975,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','a1e2094207083aac7f19e3bc219ecab2a05cf55b4ceffecc9e015f590bdab06c','e5c8208a65a9e1a26205dc0195bdf17882ef1c9debdca03ed6c013a05a40e45c');
INSERT INTO AuditLog VALUES('cmmu98wyl0022rq6b7asfr8cw',1773730339293,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','2a8259f92961a53a20b64cbfbd639a534594b6170eefb67f427407939eca208a','a1e2094207083aac7f19e3bc219ecab2a05cf55b4ceffecc9e015f590bdab06c');
INSERT INTO AuditLog VALUES('cmmu992ki0027rq6bauidfzqo',1773730346563,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','7060e328fd1fddaf184efa092133b50914c40a5a4cfaa4c3066b6a1ae1dbed9f','2a8259f92961a53a20b64cbfbd639a534594b6170eefb67f427407939eca208a');
INSERT INTO AuditLog VALUES('cmmu9932m002frq6bnfruzjix',1773730347215,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','cdc3460190e2e99a12542bf966eef4902a93e330bfecb401ce62180b5a11bedf','7060e328fd1fddaf184efa092133b50914c40a5a4cfaa4c3066b6a1ae1dbed9f');
INSERT INTO AuditLog VALUES('cmmu9932t002hrq6b9ylktj6w',1773730347221,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','c6dfdfb26dd43a14afdf483fe35e73d0d6e42e4dad17b6050323efc3fab11cf4','cdc3460190e2e99a12542bf966eef4902a93e330bfecb401ce62180b5a11bedf');
INSERT INTO AuditLog VALUES('cmmu994ug002mrq6br06llxdu',1773730349512,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','b82fcf8fb4f61048a3465efec2542f8856a925b7c519183f762c3784cbd8e52f','c6dfdfb26dd43a14afdf483fe35e73d0d6e42e4dad17b6050323efc3fab11cf4');
INSERT INTO AuditLog VALUES('cmmu9acqc002trq6bf2e6idvj',1773730406389,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6','492261203426f05699a87fc04bda4c8248f002f05eed8c538ee1a66633b48735','b82fcf8fb4f61048a3465efec2542f8856a925b7c519183f762c3784cbd8e52f');
INSERT INTO AuditLog VALUES('cmmu9acqr002zrq6bsyanjj3o',1773730406403,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6','3ab204bcacd06fd5f080f3e3c7a4e29b1e5f793775fa2b68d213eb36797be3e5','492261203426f05699a87fc04bda4c8248f002f05eed8c538ee1a66633b48735');
INSERT INTO AuditLog VALUES('cmmu9acr90031rq6biiiv98t1',1773730406421,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6','2da68380ed20111dc8f429b225583db6d8c7e5e870d9464b3b6cbb760bd89bf5','3ab204bcacd06fd5f080f3e3c7a4e29b1e5f793775fa2b68d213eb36797be3e5');
INSERT INTO AuditLog VALUES('cmmu9adrf0036rq6b88kuga5l',1773730407724,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6','2ab1ec3b45584a17f9e30bc85c50b5855295a77d7b611f85c822ff0796fb4aef','2da68380ed20111dc8f429b225583db6d8c7e5e870d9464b3b6cbb760bd89bf5');
INSERT INTO AuditLog VALUES('cmmu9avoh003crq6badz40x8z',1773730430945,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6','fb4c63df26171d373d185a21d06b2f5cf1bfd2216d12d67761c8d60f1e4de7c4','2ab1ec3b45584a17f9e30bc85c50b5855295a77d7b611f85c822ff0796fb4aef');
INSERT INTO AuditLog VALUES('cmmu9avot003hrq6bvxjdao2i',1773730430958,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6','aefe1e6fae0731907701e8cb69307b99b3c2f7c9ca5f69e2bc6bc629c770b208','fb4c63df26171d373d185a21d06b2f5cf1bfd2216d12d67761c8d60f1e4de7c4');
INSERT INTO AuditLog VALUES('cmmu9avs8003lrq6bmkiubp7g',1773730431079,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6','f5062c70b23166b8b10781261beafcb4c38d031425e9ab166deb1d1a9e6c5186','aefe1e6fae0731907701e8cb69307b99b3c2f7c9ca5f69e2bc6bc629c770b208');
INSERT INTO AuditLog VALUES('cmmu9aw04003qrq6b2szek1of',1773730431364,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6','c217da23faf8272bf9ee02eb84c782ca431daccd9a29a464060ef0cac3d57707','f5062c70b23166b8b10781261beafcb4c38d031425e9ab166deb1d1a9e6c5186');
INSERT INTO AuditLog VALUES('cmmu9bd04003zrq6bb3a92xue',1773730453397,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6','24b05a23c2b2aa708f08cd3167370142c65670d0defe40d3731749c63b898873','c217da23faf8272bf9ee02eb84c782ca431daccd9a29a464060ef0cac3d57707');
INSERT INTO AuditLog VALUES('cmmu9bd0i0044rq6b8nktyq4r',1773730453410,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6','c5090e489050378120f74a75ad271956e25e66b793212bc3862742d749fa58cc','24b05a23c2b2aa708f08cd3167370142c65670d0defe40d3731749c63b898873');
INSERT INTO AuditLog VALUES('cmmu9bd0u0046rq6bjl67q8bi',1773730453422,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6','c5c12b6eeca95249a945269045acd8d52d0b6b59459721734f96cd42aa7e9c99','c5090e489050378120f74a75ad271956e25e66b793212bc3862742d749fa58cc');
INSERT INTO AuditLog VALUES('cmmu9bd32004arq6b3uzevlr3',1773730453502,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6','04db0f6365f3e84d68af3d2bcf8fffd67d6f38ed79b4d534bf65c23335b92d8f','c5c12b6eeca95249a945269045acd8d52d0b6b59459721734f96cd42aa7e9c99');
INSERT INTO AuditLog VALUES('cmmu9btew004grq6b4x8vzyem',1773730474664,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6','660984c07440e49187290880574eae21c00602c565de1d5b998107ac8b2b1076','04db0f6365f3e84d68af3d2bcf8fffd67d6f38ed79b4d534bf65c23335b92d8f');
INSERT INTO AuditLog VALUES('cmmu9btf6004krq6bynqqoje4',1773730474675,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6','1886daebb2dfba79cefa0478baa0b2e8dab1fc8c6fb4a6f124e432e350cb163a','660984c07440e49187290880574eae21c00602c565de1d5b998107ac8b2b1076');
INSERT INTO AuditLog VALUES('cmmu9btfu004prq6bj1jvcq9f',1773730474698,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6','646f764e9a8f0d8a29f3128652ca0f179f8f5e6caaa257f0c2103d513728dd33','1886daebb2dfba79cefa0478baa0b2e8dab1fc8c6fb4a6f124e432e350cb163a');
INSERT INTO AuditLog VALUES('cmmu9btkg004urq6b76gqypky',1773730474864,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6','fffc6028ed6756aa86657b49d7ddf505c718478d18e37a8588d7c07bb2d2d085','646f764e9a8f0d8a29f3128652ca0f179f8f5e6caaa257f0c2103d513728dd33');
INSERT INTO AuditLog VALUES('cmmu9cabi0052rq6bo9rkv3qs',1773730496575,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','cc1a0ca2e1c815a31f42bee43be31d6966dc8463abb88ba81080ffc119cf6dee','fffc6028ed6756aa86657b49d7ddf505c718478d18e37a8588d7c07bb2d2d085');
INSERT INTO AuditLog VALUES('cmmu9cabt0056rq6bxmtykusq',1773730496586,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','34f38c3b420298927b59ff99788f25141e6f34e96de7f454f3b3ffd44c09d5cb','cc1a0ca2e1c815a31f42bee43be31d6966dc8463abb88ba81080ffc119cf6dee');
INSERT INTO AuditLog VALUES('cmmu9cac30059rq6bghsd054c',1773730496595,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','789af79643d8750fcee6de1429417df6ed2d62a4a3b299ae96ba0bf4c3b8d631','34f38c3b420298927b59ff99788f25141e6f34e96de7f454f3b3ffd44c09d5cb');
INSERT INTO AuditLog VALUES('cmmu9cbcz005erq6bvfg08lz5',1773730497923,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','969b98010afc1ff709811f1960a1e010a67892f614c63f118335c416d874e0f8','789af79643d8750fcee6de1429417df6ed2d62a4a3b299ae96ba0bf4c3b8d631');
INSERT INTO AuditLog VALUES('cmmu9ci4h005krq6b6fge3zqc',1773730506689,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','25a43e48dc705d0bc6d8417f3e7a2f69bb23d0774132bbd4c9e1d4a815593519','969b98010afc1ff709811f1960a1e010a67892f614c63f118335c416d874e0f8');
INSERT INTO AuditLog VALUES('cmmu9ci4z005orq6b9utc0iro',1773730506708,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','96e48401e68a720ed1c396cf9db6d95b7ef99ad838db1b531bfbaa0b9f7e5df7','25a43e48dc705d0bc6d8417f3e7a2f69bb23d0774132bbd4c9e1d4a815593519');
INSERT INTO AuditLog VALUES('cmmu9ci87005trq6bwegd7y7v',1773730506824,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','dcbb4d642a3d7992be1cf9ebbf04ef4b5c5e0c7c7c0d4d3bb97d90e8ee8743b6','96e48401e68a720ed1c396cf9db6d95b7ef99ad838db1b531bfbaa0b9f7e5df7');
INSERT INTO AuditLog VALUES('cmmu9cins005yrq6bwmld6tcg',1773730507384,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','a37eacd53b19dc3de9a6b14d7babbab57a608b5ad771edd457315f45f2b7d965','dcbb4d642a3d7992be1cf9ebbf04ef4b5c5e0c7c7c0d4d3bb97d90e8ee8743b6');
INSERT INTO AuditLog VALUES('cmmu9cpdl0064rq6b192qbdqf',1773730516089,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','403d0193a2c6b1a0c04fa58921e57238f4adb2a23b08b3a5571e319de289aff3','a37eacd53b19dc3de9a6b14d7babbab57a608b5ad771edd457315f45f2b7d965');
INSERT INTO AuditLog VALUES('cmmu9cpet0068rq6bx4n1v5ao',1773730516133,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','b40ace7bec95bf26dc929e8f2aaaa5a96aee99330c3310151bb85f7e105dd976','403d0193a2c6b1a0c04fa58921e57238f4adb2a23b08b3a5571e319de289aff3');
INSERT INTO AuditLog VALUES('cmmu9cpqb006drq6by9nbxyq7',1773730516547,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','7e9091f312e970cb0c3bd0757171eb7f73b3721cea74350938a88a9a55dbf53d','b40ace7bec95bf26dc929e8f2aaaa5a96aee99330c3310151bb85f7e105dd976');
INSERT INTO AuditLog VALUES('cmmu9cq09006irq6bshx6atk5',1773730516905,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','f2af6375936b699f6a03693627c9510d7ce509bc9e1698902f095d2daba49a6c','7e9091f312e970cb0c3bd0757171eb7f73b3721cea74350938a88a9a55dbf53d');
INSERT INTO AuditLog VALUES('cmmu9cw2s006nrq6bm4iqj6hw',1773730524772,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','53c11be0fd5edd54b9ee901c57a26075356443b172e0a327517c08afb5fd236e','f2af6375936b699f6a03693627c9510d7ce509bc9e1698902f095d2daba49a6c');
INSERT INTO AuditLog VALUES('cmmu9cw35006srq6blgj63qk7',1773730524785,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','340b1983971a52b0a0fc3865ab589d7d67f0c03a8d7d5bdf3695cb0d6e42f124','53c11be0fd5edd54b9ee901c57a26075356443b172e0a327517c08afb5fd236e');
INSERT INTO AuditLog VALUES('cmmu9cwkl006xrq6b762fhkok',1773730525413,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','fc45a05f3d8a9cc0bef6788812c73c3d6306089cc59620b0e08a53a69bc81760','340b1983971a52b0a0fc3865ab589d7d67f0c03a8d7d5bdf3695cb0d6e42f124');
INSERT INTO AuditLog VALUES('cmmu9cwvd0072rq6b2n7ddkul',1773730525801,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','8fa91ac51da58a478259fc6eb87b40536abcc95e334622a3048409909c3aeb44','fc45a05f3d8a9cc0bef6788812c73c3d6306089cc59620b0e08a53a69bc81760');
INSERT INTO AuditLog VALUES('cmmu9deb1007crq6bmmwger2b',1773730548398,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','64adbbbe9a1d6514dae507817fea3c5d3b7ac3a3687837eefb5bcc981189ee25','8fa91ac51da58a478259fc6eb87b40536abcc95e334622a3048409909c3aeb44');
INSERT INTO AuditLog VALUES('cmmu9deb00078rq6b1m1d0b8u',1773730548396,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','f5b853647dadf79018aa8e1845d76537b321b932be2dec9b2464102bb7e29031','8fa91ac51da58a478259fc6eb87b40536abcc95e334622a3048409909c3aeb44');
INSERT INTO AuditLog VALUES('cmmu9dec4007mrq6b7h33z1yo',1773730548436,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','527d746434032b3ed8e24bd4b44753d342d7f7df46ac055da5af2800c2250826','64adbbbe9a1d6514dae507817fea3c5d3b7ac3a3687837eefb5bcc981189ee25');
INSERT INTO AuditLog VALUES('cmmu9dec1007irq6bhrf1s9as',1773730548434,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','0fe43e784e5f11e9bbb998acf3359bb2a934f35f582d1a3f437be2611aeaf02a','64adbbbe9a1d6514dae507817fea3c5d3b7ac3a3687837eefb5bcc981189ee25');
INSERT INTO AuditLog VALUES('cmmu9dn1w007rrq6bjwjh5dkx',1773730559732,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','cc3fc0134dc96667c034d230f74e0bb5512ab02a006a477910729d661a77573c','527d746434032b3ed8e24bd4b44753d342d7f7df46ac055da5af2800c2250826');
INSERT INTO AuditLog VALUES('cmmu9dn2c007wrq6by1lsk75r',1773730559748,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','30d469fccc143fd098b2c9e080f92f89f1bf07f76f0f677ef53cd153ea8fb2a7','cc3fc0134dc96667c034d230f74e0bb5512ab02a006a477910729d661a77573c');
INSERT INTO AuditLog VALUES('cmmu9dn2v0081rq6bluaz43fb',1773730559767,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','6b91bc6ace5f468092c339d7e6f19b22006086947ea2cab68cfe780bb5927fdf','30d469fccc143fd098b2c9e080f92f89f1bf07f76f0f677ef53cd153ea8fb2a7');
INSERT INTO AuditLog VALUES('cmmu9dn4p0086rq6b7ajikq91',1773730559833,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','abf8828d4c7f4f4f0d5be9f8a6d056e3ae34c50b228d3426bc2d6d59922cf1b2','6b91bc6ace5f468092c339d7e6f19b22006086947ea2cab68cfe780bb5927fdf');
INSERT INTO AuditLog VALUES('cmmu9du7o008brq6bpkysrdfw',1773730569012,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','90f03fe06b3ce523530ab7a8a33fcbcaf402c345796cc44e7f125256c4a73b2b','abf8828d4c7f4f4f0d5be9f8a6d056e3ae34c50b228d3426bc2d6d59922cf1b2');
INSERT INTO AuditLog VALUES('cmmu9duo9008grq6bjso2a6d1',1773730569609,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','ac50e137727117240f94d204fc363e00230e347289c2844ff289dd6ffb7008ef','90f03fe06b3ce523530ab7a8a33fcbcaf402c345796cc44e7f125256c4a73b2b');
INSERT INTO AuditLog VALUES('cmmu9duol008lrq6bcgzjtgnm',1773730569621,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','6f9744eff740ca24eadb71deff0a94f1472109b7d4d0ad70429f4dd4391a30e8','ac50e137727117240f94d204fc363e00230e347289c2844ff289dd6ffb7008ef');
INSERT INTO AuditLog VALUES('cmmu9dup9008qrq6bpg4r4ijj',1773730569646,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','277c27ef9ac4757fd5e5f4272e02f4f02c815dab5140d3c016df5ccf8b392d35','6f9744eff740ca24eadb71deff0a94f1472109b7d4d0ad70429f4dd4391a30e8');
INSERT INTO AuditLog VALUES('cmmu9e0tn008vrq6b3wb9rltm',1773730577580,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','66371dd1846ec13fed56dd345d5f32055ed65c93e4b11fe9b9ae1178ae9fd83b','277c27ef9ac4757fd5e5f4272e02f4f02c815dab5140d3c016df5ccf8b392d35');
INSERT INTO AuditLog VALUES('cmmu9e1vq0090rq6bjhkbs017',1773730578950,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','5947b65eff2bd59064400fe5d4fe67aca2f0c232467f239134a2b2df70109002','66371dd1846ec13fed56dd345d5f32055ed65c93e4b11fe9b9ae1178ae9fd83b');
INSERT INTO AuditLog VALUES('cmmu9e1w4009arq6bihpt6kcm',1773730578964,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','81bfac8c8536f29d7e91cc92d970a4cfa71ed1cd0b5a175d15d701733a33a5f6','5947b65eff2bd59064400fe5d4fe67aca2f0c232467f239134a2b2df70109002');
INSERT INTO AuditLog VALUES('cmmu9e1w20096rq6bd6vra2xl',1773730578963,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','0ee7abc826ca97274d690ba5a88131a8207f924cf9a718ff8ec1dfa99df4e417','5947b65eff2bd59064400fe5d4fe67aca2f0c232467f239134a2b2df70109002');
INSERT INTO AuditLog VALUES('cmmu9fj90009frq6b2cej4mef',1773730648117,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','b8508c276c588ec4b0f53409d9db4fad190d05e5f66640de5e5a768e57dc95d8','81bfac8c8536f29d7e91cc92d970a4cfa71ed1cd0b5a175d15d701733a33a5f6');
INSERT INTO AuditLog VALUES('cmmu9ydde009krq6bc73la0ju',1773731526963,'cmmnqsfl8000003yp8yo84l46','LOGIN','SECURITY','cmmnqsfl8000003yp8yo84l46','null','"{\"mfaUsed\":false}"','127.0.0.1','curl/8.7.1','ab3676536204578aa709b4f3befe37e36080837418ca2718fa3fd222b3c2f646','b8508c276c588ec4b0f53409d9db4fad190d05e5f66640de5e5a768e57dc95d8');
CREATE TABLE IF NOT EXISTS "CsrfToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS "UserPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "density" TEXT NOT NULL DEFAULT 'normal',
    "language" TEXT NOT NULL DEFAULT 'th',
    "pageSize" INTEGER NOT NULL DEFAULT 25,
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "currencyFormat" TEXT NOT NULL DEFAULT 'THB',
    "dashboardLayout" JSONB,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "SavedFilter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "sortField" TEXT,
    "sortOrder" TEXT NOT NULL DEFAULT 'desc',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "module" TEXT,
    "recordId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "RecentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "recordName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "accessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "DocumentLock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "module" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "lockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "sessionId" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "ActivityFeed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "recordId" TEXT,
    "recordName" TEXT,
    "details" JSONB,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purchaseDate" DATETIME NOT NULL,
    "purchaseCost" INTEGER NOT NULL,
    "salvageValue" INTEGER NOT NULL DEFAULT 100,
    "usefulLifeYears" INTEGER NOT NULL,
    "depreciationRate" REAL NOT NULL,
    "glAccountId" TEXT NOT NULL,
    "accumDepAccountId" TEXT NOT NULL,
    "depExpenseAccountId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO Asset VALUES('cmmu3rc9j000hrqzh7awacwea','TEST-001','Test Computer',1705276800000,50000,5000,5,20.0,'cmmnqsflq000l03ypgv9rhm1o','cmmnqsflr000m03yp88g9exdv','cmmnqsfme001p03yppbuu59wi',1,NULL,NULL,NULL,1773721121239,1773721121239);
CREATE TABLE IF NOT EXISTS "BankReconciliation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankAccountId" TEXT NOT NULL,
    "statementDate" DATETIME NOT NULL,
    "statementBalance" INTEGER NOT NULL DEFAULT 0,
    "bookBalance" INTEGER NOT NULL DEFAULT 0,
    "difference" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reconciledAt" DATETIME,
    "reconciledById" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BankReconciliation_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Cheque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chequeNo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "amount" INTEGER NOT NULL,
    "payeeName" TEXT,
    "status" TEXT NOT NULL,
    "documentRef" TEXT,
    "clearedDate" DATETIME,
    "journalEntryId" TEXT,
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciliationId" TEXT,
    "paymentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cheque_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cheque_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cheque_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "BankReconciliation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Cheque_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "CreditNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creditNoteNo" TEXT NOT NULL,
    "creditNoteDate" DATETIME NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "reason" TEXT,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "vatRate" REAL NOT NULL DEFAULT 7,
    "vatAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "journalEntryId" TEXT,
    CONSTRAINT "CreditNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CreditNote_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CreditNote_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "taxId" TEXT,
    "branchCode" TEXT,
    "address" TEXT,
    "subDistrict" TEXT,
    "district" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "website" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "creditLimit" INTEGER NOT NULL DEFAULT 0,
    "creditDays" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "notes" TEXT,
    "externalRefId" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO Customer VALUES('cmmnqsfnv002e03yp578gaiw4','C001','บริษัท เอบีซี จำกัด',NULL,'0105555123456',NULL,NULL,NULL,NULL,'กรุงเทพมหานคร',NULL,'02-111-2222',NULL,NULL,NULL,NULL,NULL,100000,30,1,NULL,NULL,NULL,NULL,NULL,1773336540236,1773336540236);
INSERT INTO Customer VALUES('cmmnqsfny002f03ypd4bjwgay','C002','บริษัท เอ็กซ์วายแซด จำกัด',NULL,'0105555789012',NULL,NULL,NULL,NULL,'กรุงเทพมหานคร',NULL,'02-333-4444',NULL,NULL,NULL,NULL,NULL,100000,30,1,NULL,NULL,NULL,NULL,NULL,1773336540238,1773336540238);
INSERT INTO Customer VALUES('cmmnqsfnz002g03yphswo9pvl','C003','ห้างหุ้นส่วนจำกัด ไทยเทรดดิ้ง',NULL,'0105555345678',NULL,NULL,NULL,NULL,'กรุงเทพมหานคร',NULL,'02-555-6666',NULL,NULL,NULL,NULL,NULL,100000,30,1,NULL,NULL,NULL,NULL,NULL,1773336540239,1773336540239);
INSERT INTO Customer VALUES('cmmnqsfoa002n03ypujr9faqw','C004','บริษัท ไทย ฟู้ดส์ จำกัด',NULL,'0105551234567',NULL,'123 ถนนสุขุมวิท เขตวัฒนา กรุงเทพฯ 10110',NULL,NULL,'กรุงเทพมหานคร',NULL,'02-123-4567',NULL,'accounting@thaifoods.co.th',NULL,'สมชาย ใจดี',NULL,100000,30,1,NULL,NULL,NULL,NULL,NULL,1773336540250,1773336540250);
INSERT INTO Customer VALUES('cmmnqsfob002o03yp486systw','C005','บริษัท เจริญ การค้า จำกัด',NULL,'0105552345678',NULL,'456 ถนนพระราม 4 เขตบางรัก กรุงเทพฯ 10500',NULL,NULL,'กรุงเทพมหานคร',NULL,'02-234-5678',NULL,'ap@charoen.co.th',NULL,'วิชัย มั่งมี',NULL,150000,45,1,NULL,NULL,NULL,NULL,NULL,1773336540252,1773336540252);
INSERT INTO Customer VALUES('cmmnqsfoc002p03ypyligccx6','C006','ห้างหุ้นส่วนจำกัด สยาม ทรานสปอร์ต',NULL,'0105553456789',NULL,'789 ถนนวิภาวดีรังสิต เขตดอนเมือง กรุงเทพฯ 10210',NULL,NULL,'กรุงเทพมหานคร',NULL,'02-345-6789',NULL,'transport@siam.co.th',NULL,'อนันต์ บุญสม',NULL,80000,30,1,NULL,NULL,NULL,NULL,NULL,1773336540252,1773336540252);
INSERT INTO Customer VALUES('cmmnqsfod002q03ypq9psp0cp','C007','บริษัท อุตสาหกรรม ไทย-จีน จำกัด',NULL,'0105554567890',NULL,'321 ถนนเกษตร เขตหลักสี่ กรุงเทพฯ 10240',NULL,NULL,'กรุงเทพมหานคร',NULL,'02-456-7890',NULL,'finance@thaichina.co.th',NULL,'จีน ฮั่ว',NULL,200000,60,1,NULL,NULL,NULL,NULL,NULL,1773336540253,1773336540253);
INSERT INTO Customer VALUES('cmmnqsfod002r03ypnnxspoql','C008','บริษัท ดิจิทัล โซลูชั่น จำกัด',NULL,'0105555678901',NULL,'654 ถนนสาทร เขตสาทร กรุงเทพฯ 10120',NULL,NULL,'กรุงเทพมหานคร',NULL,'02-567-8901',NULL,'credit@digital.co.th',NULL,'ไอที โปรแกรมเมอร์',NULL,120000,30,1,NULL,NULL,NULL,NULL,NULL,1773336540254,1773336540254);
INSERT INTO Customer VALUES('cmmnqsfoe002s03yp4hz59isa','C009','บริษัท พฤกษา คอนสตรัคชั่น จำกัด',NULL,'0105556789012',NULL,'987 ถนนพหลโยธิน เขตพญาไท กรุงเทพฯ 10400',NULL,NULL,'กรุงเทพมหานคร',NULL,'02-678-9012',NULL,'account@phruksa.co.th',NULL,'สมศักดิ์ วิศวกร',NULL,300000,45,1,NULL,NULL,NULL,NULL,NULL,1773336540255,1773336540255);
INSERT INTO Customer VALUES('cmmnqsfof002t03yp8loq7sxu','C010','บริษัท เหมืองแร่ เอเชีย จำกัด',NULL,'0105557890123',NULL,'147 ถนนสีลม เขตบางรัก กรุงเทพฯ 10500',NULL,NULL,'กรุงเทพมหานคร',NULL,'02-789-0123',NULL,'ap@asiamining.co.th',NULL,'เหมือง แร่',NULL,500000,60,1,NULL,NULL,NULL,NULL,NULL,1773336540255,1773336540255);
INSERT INTO Customer VALUES('cmmnqsfog002u03ypst138m6t','C011','ห้างหุ้นส่วนจำกัด โรงน้ำแข็ง ไทย',NULL,'0105558901234',NULL,'258 ถนนเจริญกรุง เขตปทุมวัน กรุงเทพฯ 10330',NULL,NULL,'กรุงเทพมหานคร',NULL,'02-890-1234',NULL,'sales@icecube.co.th',NULL,'เย็น จังเลย',NULL,50000,30,1,NULL,NULL,NULL,NULL,NULL,1773336540256,1773336540256);
INSERT INTO Customer VALUES('cmmnqsfog002v03ypv4chdzf0','C012','บริษัท สยาม เซรามิก จำกัด',NULL,'0321456789012',NULL,'369 อำเภอเมือง จังหวัดสระบุรี 18000',NULL,NULL,'สระบุรี',NULL,'036-123-456',NULL,'account@siamceramic.co.th',NULL,'ดิน เผา',NULL,180000,45,1,NULL,NULL,NULL,NULL,NULL,1773336540257,1773336540257);
INSERT INTO Customer VALUES('cmmnqsfoh002w03ypwdu53urn','C013','บริษัท ภาคตะวันออก เปเปอร์ จำกัด',NULL,'0201456789012',NULL,'741 อำเภอเมือง จังหวัดชลบุรี 20000',NULL,NULL,'ชลบุรี',NULL,'038-234-567',NULL,'sales@eastpaper.co.th',NULL,'กระดาษ ขาว',NULL,250000,30,1,NULL,NULL,NULL,NULL,NULL,1773336540258,1773336540258);
INSERT INTO Customer VALUES('cmmnqsfoi002x03ypyfnjsd1q','C014','บริษัท ระยอง ฟิชชี่ จำกัด',NULL,'0202456789012',NULL,'852 อำเภอเมือง จังหวัดระยอง 21000',NULL,NULL,'ระยอง',NULL,'038-345-678',NULL,'fish@rayong.co.th',NULL,'ปลา สด',NULL,150000,30,1,NULL,NULL,NULL,NULL,NULL,1773336540258,1773336540258);
INSERT INTO Customer VALUES('cmmnqsfoj002y03ypsybp3mqe','C015','บริษัท พัทยา รีสอร์ท จำกัด',NULL,'0203456789012',NULL,'963 อำเภอบางละมุง จังหวัดชลบุรี 20150',NULL,NULL,'ชลบุรี',NULL,'038-456-789',NULL,'reservation@pattaya.co.th',NULL,'โรงแรม หรู',NULL,400000,45,1,NULL,NULL,NULL,NULL,NULL,1773336540259,1773336540259);
INSERT INTO Customer VALUES('cmmnqsfoj002z03ypc6lare6g','C016','บริษัท เชียงใหม่ คอตตอน จำกัด',NULL,'0501456789012',NULL,'159 อำเภอเมือง จังหวัดเชียงใหม่ 50000',NULL,NULL,'เชียงใหม่',NULL,'053-123-456',NULL,'order@chiangmaicotton.co.th',NULL,'ฝ้าย แท้',NULL,100000,30,1,NULL,NULL,NULL,NULL,NULL,1773336540260,1773336540260);
INSERT INTO Customer VALUES('cmmnqsfok003003yps2usgzvn','C017','บริษัท ภาคเหนือ ไม้์ จำกัด',NULL,'0502456789012',NULL,'357 อำเภอเมือง จังหวัดเชียงราย 57000',NULL,NULL,'เชียงราย',NULL,'053-234-567',NULL,'sales@northernwood.co.th',NULL,'ไม้ แข็ง',NULL,120000,45,1,NULL,NULL,NULL,NULL,NULL,1773336540260,1773336540260);
INSERT INTO Customer VALUES('cmmnqsfol003103ypu3c1ig92','C018','บริษัท ขอนแก่น อินดัสเทรียล จำกัด',NULL,'0401456789012',NULL,'486 อำเภอเมือง จังหวัดขอนแก่น 40000',NULL,NULL,'ขอนแก่น',NULL,'043-123-456',NULL,'factory@khonkaen.co.th',NULL,'โรงงาน ใหญ่',NULL,220000,60,1,NULL,NULL,NULL,NULL,NULL,1773336540261,1773336540261);
INSERT INTO Customer VALUES('cmmnqsfol003203yp3w22b07b','C019','บริษัท อีสาน ฟาร์ม จำกัด',NULL,'0402456789012',NULL,'268 อำเภอเมือง จังหวัดนครราชสีมา 30000',NULL,NULL,'นครราชสีมา',NULL,'044-123-456',NULL,'farm@isan.co.th',NULL,'เกษตร กรรม',NULL,90000,30,1,NULL,NULL,NULL,NULL,NULL,1773336540262,1773336540262);
INSERT INTO Customer VALUES('cmmnqsfom003303ypmto9pwvp','C020','บริษัท ใต้ฟ้า เฟอร์นิเจอร์ จำกัด',NULL,'0801456789012',NULL,'975 อำเภอเมือง จังหวัดสุราษฎร์ธานี 84000',NULL,NULL,'สุราษฎร์ธานี',NULL,'077-123-456',NULL,'export@taifa.co.th',NULL,'ไม้ สวย',NULL,180000,45,1,NULL,NULL,NULL,NULL,NULL,1773336540263,1773336540263);
INSERT INTO Customer VALUES('cmmnqsfon003403ypdgeen6ik','C021','บริษัท ภูเก็ต ทัวร์ จำกัด',NULL,'0802456789012',NULL,'684 อำเภอเมือง จังหวัดภูเก็ต 83000',NULL,NULL,'ภูเก็ต',NULL,'076-123-456',NULL,'travel@phuket.co.th',NULL,'ท่องเที่ยว สนุก',NULL,160000,30,1,NULL,NULL,NULL,NULL,NULL,1773336540264,1773336540264);
INSERT INTO Customer VALUES('cmmnqsfoo003503yp4gqmjcw8','C022','บริษัท หาดใหญ่ เทรดดิ้ง จำกัด',NULL,'0901456789012',NULL,'147 อำเภอหาดใหญ่ จังหวัดสงขลา 90110',NULL,NULL,'สงขลา',NULL,'074-123-456',NULL,'trade@hatyai.co.th',NULL,'ค้าขาย รวย',NULL,140000,30,1,NULL,NULL,NULL,NULL,NULL,1773336540264,1773336540264);
INSERT INTO Customer VALUES('cmmnqsfop003603ypqfaggzwg','C023','บริษัท นารา ไทย จำกัด',NULL,'0721456789012',NULL,'369 อำเภอเมือง จังหวัดเชียงใหม่ 50100',NULL,NULL,'เชียงใหม่',NULL,'053-234-789',NULL,'sales@narathai.co.th',NULL,'วิญญาณ สงบ',NULL,110000,30,1,NULL,NULL,NULL,NULL,NULL,1773336540265,1773336540265);
INSERT INTO Customer VALUES('cmmu7fmjd00csrqcgzjjeujtb','CUST-1773727292601','ลูกค้าทดสอบ 1773727292601',NULL,'1234567890123',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,100000,30,1,NULL,NULL,NULL,NULL,NULL,1773727293145,1773727293145);
CREATE TABLE IF NOT EXISTS "DebitNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "debitNoteNo" TEXT NOT NULL,
    "debitNoteDate" DATETIME NOT NULL,
    "vendorId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "reason" TEXT,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "vatRate" REAL NOT NULL DEFAULT 7,
    "vatAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "journalEntryId" TEXT,
    CONSTRAINT "DebitNote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DebitNote_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "PurchaseInvoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DebitNote_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "DepreciationSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "amount" INTEGER NOT NULL,
    "accumulated" INTEGER NOT NULL,
    "netBookValue" INTEGER NOT NULL,
    "journalEntryId" TEXT,
    "posted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DepreciationSchedule_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO DepreciationSchedule VALUES('cmmu3rc9u000jrqzh0hszltxa','cmmu3rc9j000hrqzh7awacwea',1706659200000,750,750,49250,NULL,0,1773721121250);
INSERT INTO DepreciationSchedule VALUES('cmmu3rc9w000lrqzhzi55n1td','cmmu3rc9j000hrqzh7awacwea',1709164800000,750,1500,48500,NULL,0,1773721121253);
INSERT INTO DepreciationSchedule VALUES('cmmu3rc9x000nrqzh3zpkfa2i','cmmu3rc9j000hrqzh7awacwea',1711843200000,750,2250,47750,NULL,0,1773721121254);
INSERT INTO DepreciationSchedule VALUES('cmmu3rc9z000prqzhem6bqls5','cmmu3rc9j000hrqzh7awacwea',1714435200000,750,3000,47000,NULL,0,1773721121255);
INSERT INTO DepreciationSchedule VALUES('cmmu3rca1000rrqzhjz2zuxsr','cmmu3rc9j000hrqzh7awacwea',1717113600000,750,3750,46250,NULL,0,1773721121257);
INSERT INTO DepreciationSchedule VALUES('cmmu3rca2000trqzhxfpbp8n4','cmmu3rc9j000hrqzh7awacwea',1719705600000,750,4500,45500,NULL,0,1773721121259);
INSERT INTO DepreciationSchedule VALUES('cmmu3rca3000vrqzh17kbiocg','cmmu3rc9j000hrqzh7awacwea',1722384000000,750,5250,44750,NULL,0,1773721121259);
INSERT INTO DepreciationSchedule VALUES('cmmu3rca4000xrqzhv40vnqhx','cmmu3rc9j000hrqzh7awacwea',1725062400000,750,6000,44000,NULL,0,1773721121260);
INSERT INTO DepreciationSchedule VALUES('cmmu3rca4000zrqzhdf3v06ap','cmmu3rc9j000hrqzh7awacwea',1727654400000,750,6750,43250,NULL,0,1773721121261);
INSERT INTO DepreciationSchedule VALUES('cmmu3rca50011rqzhm1d6l3hq','cmmu3rc9j000hrqzh7awacwea',1730332800000,750,7500,42500,NULL,0,1773721121261);
INSERT INTO DepreciationSchedule VALUES('cmmu3rca50013rqzhax848r9u','cmmu3rc9j000hrqzh7awacwea',1732924800000,750,8250,41750,NULL,0,1773721121262);
INSERT INTO DepreciationSchedule VALUES('cmmu3rca60015rqzhjp1cu8uo','cmmu3rc9j000hrqzh7awacwea',1735603200000,750,9000,41000,NULL,0,1773721121263);
INSERT INTO DepreciationSchedule VALUES('cmmu3rca70017rqzh8l5watyc','cmmu3rc9j000hrqzh7awacwea',1738281600000,750,9750,40250,NULL,0,1773721121263);
INSERT INTO DepreciationSchedule VALUES('cmmu3rca80019rqzhecjdzcs4','cmmu3rc9j000hrqzh7awacwea',1740700800000,750,10500,39500,NULL,0,1773721121264);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcaa001brqzheqpmwjvd','cmmu3rc9j000hrqzh7awacwea',1743379200000,750,11250,38750,NULL,0,1773721121266);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcaa001drqzhiuzfcvfl','cmmu3rc9j000hrqzh7awacwea',1745971200000,750,12000,38000,NULL,0,1773721121267);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcab001frqzh00p1rrm4','cmmu3rc9j000hrqzh7awacwea',1748649600000,750,12750,37250,NULL,0,1773721121268);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcac001hrqzhgm3fpo8e','cmmu3rc9j000hrqzh7awacwea',1751241600000,750,13500,36500,NULL,0,1773721121268);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcac001jrqzhej9r3t92','cmmu3rc9j000hrqzh7awacwea',1753920000000,750,14250,35750,NULL,0,1773721121269);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcad001lrqzhe16470ip','cmmu3rc9j000hrqzh7awacwea',1756598400000,750,15000,35000,NULL,0,1773721121269);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcad001nrqzh8oxvxcvo','cmmu3rc9j000hrqzh7awacwea',1759190400000,750,15750,34250,NULL,0,1773721121270);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcae001prqzh8ddxfgis','cmmu3rc9j000hrqzh7awacwea',1761868800000,750,16500,33500,NULL,0,1773721121270);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcag001rrqzh1ht4orkv','cmmu3rc9j000hrqzh7awacwea',1764460800000,750,17250,32750,NULL,0,1773721121272);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcah001trqzhsu1n0sre','cmmu3rc9j000hrqzh7awacwea',1767139200000,750,18000,32000,NULL,0,1773721121273);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcah001vrqzh89giw5d2','cmmu3rc9j000hrqzh7awacwea',1769817600000,750,18750,31250,NULL,0,1773721121273);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcap001xrqzhudyas1kb','cmmu3rc9j000hrqzh7awacwea',1772236800000,750,19500,30500,NULL,0,1773721121281);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcap001zrqzhqz7vjvfe','cmmu3rc9j000hrqzh7awacwea',1774915200000,750,20250,29750,NULL,0,1773721121282);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcaq0021rqzhxpsrxako','cmmu3rc9j000hrqzh7awacwea',1777507200000,750,21000,29000,NULL,0,1773721121283);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcar0023rqzhcl4hjuh6','cmmu3rc9j000hrqzh7awacwea',1780185600000,750,21750,28250,NULL,0,1773721121283);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcat0025rqzhmweu9syo','cmmu3rc9j000hrqzh7awacwea',1782777600000,750,22500,27500,NULL,0,1773721121286);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcav0027rqzhqfd3jnfw','cmmu3rc9j000hrqzh7awacwea',1785456000000,750,23250,26750,NULL,0,1773721121287);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcav0029rqzhnwiq54s9','cmmu3rc9j000hrqzh7awacwea',1788134400000,750,24000,26000,NULL,0,1773721121288);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcaw002brqzh18v8la6t','cmmu3rc9j000hrqzh7awacwea',1790726400000,750,24750,25250,NULL,0,1773721121288);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcaz002drqzhkhsagjav','cmmu3rc9j000hrqzh7awacwea',1793404800000,750,25500,24500,NULL,0,1773721121291);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcb1002frqzhhyw26uu5','cmmu3rc9j000hrqzh7awacwea',1795996800000,750,26250,23750,NULL,0,1773721121293);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcb1002hrqzhj14987d8','cmmu3rc9j000hrqzh7awacwea',1798675200000,750,27000,23000,NULL,0,1773721121294);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcb2002jrqzhluctt5zg','cmmu3rc9j000hrqzh7awacwea',1801353600000,750,27750,22250,NULL,0,1773721121294);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcb2002lrqzhvz0rfv8p','cmmu3rc9j000hrqzh7awacwea',1803772800000,750,28500,21500,NULL,0,1773721121295);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcb3002nrqzhmdmaig0l','cmmu3rc9j000hrqzh7awacwea',1806451200000,750,29250,20750,NULL,0,1773721121296);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcb5002prqzh125ur3ul','cmmu3rc9j000hrqzh7awacwea',1809043200000,750,30000,20000,NULL,0,1773721121297);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcb7002rrqzhtwmebt6m','cmmu3rc9j000hrqzh7awacwea',1811721600000,750,30750,19250,NULL,0,1773721121300);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcb9002trqzh22giwc6c','cmmu3rc9j000hrqzh7awacwea',1814313600000,750,31500,18500,NULL,0,1773721121301);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcb9002vrqzhi6g1zt86','cmmu3rc9j000hrqzh7awacwea',1816992000000,750,32250,17750,NULL,0,1773721121302);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcba002xrqzhmpqf7shm','cmmu3rc9j000hrqzh7awacwea',1819670400000,750,33000,17000,NULL,0,1773721121303);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcbb002zrqzhs4v4emhc','cmmu3rc9j000hrqzh7awacwea',1822262400000,750,33750,16250,NULL,0,1773721121303);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcbc0031rqzh1ofdr1i0','cmmu3rc9j000hrqzh7awacwea',1824940800000,750,34500,15500,NULL,0,1773721121304);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcbc0033rqzhx5ts2e0p','cmmu3rc9j000hrqzh7awacwea',1827532800000,750,35250,14750,NULL,0,1773721121305);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcbd0035rqzh8vbbn8pa','cmmu3rc9j000hrqzh7awacwea',1830211200000,750,36000,14000,NULL,0,1773721121305);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcbd0037rqzhovpgx9am','cmmu3rc9j000hrqzh7awacwea',1832889600000,750,36750,13250,NULL,0,1773721121305);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcbd0039rqzhnxxed2li','cmmu3rc9j000hrqzh7awacwea',1835395200000,750,37500,12500,NULL,0,1773721121306);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcbe003brqzhglfuj8jz','cmmu3rc9j000hrqzh7awacwea',1838073600000,750,38250,11750,NULL,0,1773721121307);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcbh003drqzhl9c24d39','cmmu3rc9j000hrqzh7awacwea',1840665600000,750,39000,11000,NULL,0,1773721121309);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcbh003frqzhbnbj9tcj','cmmu3rc9j000hrqzh7awacwea',1843344000000,750,39750,10250,NULL,0,1773721121310);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcbi003hrqzh9fdflkx4','cmmu3rc9j000hrqzh7awacwea',1845936000000,750,40500,9500,NULL,0,1773721121310);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcbi003jrqzhu4saou3v','cmmu3rc9j000hrqzh7awacwea',1848614400000,750,41250,8750,NULL,0,1773721121311);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcbj003lrqzh8jzkncjj','cmmu3rc9j000hrqzh7awacwea',1851292800000,750,42000,8000,NULL,0,1773721121311);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcbj003nrqzhk9orgcd0','cmmu3rc9j000hrqzh7awacwea',1853884800000,750,42750,7250,NULL,0,1773721121312);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcbl003prqzhodfnb8lg','cmmu3rc9j000hrqzh7awacwea',1856563200000,750,43500,6500,NULL,0,1773721121313);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcbo003rrqzh2okau4w0','cmmu3rc9j000hrqzh7awacwea',1859155200000,750,44250,5750,NULL,0,1773721121316);
INSERT INTO DepreciationSchedule VALUES('cmmu3rcbt003trqzhki5246r0','cmmu3rc9j000hrqzh7awacwea',1861833600000,750,45000,5000,NULL,0,1773721121322);
CREATE TABLE IF NOT EXISTS "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeCode" TEXT NOT NULL,
    "externalRefId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "idCardNumber" TEXT,
    "hireDate" DATETIME NOT NULL,
    "baseSalary" INTEGER NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "socialSecurityNo" TEXT,
    "taxId" TEXT,
    "bankAccountNo" TEXT,
    "bankName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO Employee VALUES('cmmu3rp2p003urqzhf78hi4hy','EMP-001',NULL,'สมชาย','ใจดี','1234567890123',1704067200000,35000,'Programmer','IT','1234567890','1234567890123','1234567890','กสิกรไทย',1,NULL,NULL,NULL,1773721137841,1773721137841);
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNo" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TAX_INVOICE',
    "reference" TEXT,
    "poNumber" TEXT,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "vatRate" REAL NOT NULL DEFAULT 7,
    "vatRateType" TEXT NOT NULL DEFAULT 'STANDARD_7',
    "vatAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "discountPercent" REAL NOT NULL DEFAULT 0,
    "withholdingRate" REAL NOT NULL DEFAULT 0,
    "withholdingAmount" INTEGER NOT NULL DEFAULT 0,
    "netAmount" INTEGER NOT NULL DEFAULT 0,
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "internalNotes" TEXT,
    "terms" TEXT,
    "sourceChannel" TEXT,
    "metadata" JSONB,
    "createdById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "journalEntryId" TEXT,
    "currencyId" TEXT,
    "exchangeRate" REAL NOT NULL DEFAULT 1,
    "foreignAmount" INTEGER,
    CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO Invoice VALUES('cmmnqsfoz003g03yp4r7law0j','INV2602-0001',1770908730138,1773500730138,'cmmnqsfop003603ypqfaggzwg','TAX_INVOICE',NULL,NULL,54246,7.0,'STANDARD_7',3797,58043,0,0.0,0.0,0,58043,29021.5,'PARTIAL',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540275,1773336540457,'cmmnqsfqs00c103yp4muw6n1g',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfp5004503ypuaort8fa','INV2510-0002',1760058079042,1762650079042,'cmmnqsfny002f03ypd4bjwgay','TAX_INVOICE',NULL,NULL,37087,7.0,'STANDARD_7',2596,39683,0,0.0,0.0,0,39683,0,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540281,1773336540458,'cmmnqsfqu00c603ypcrdkdnlg',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfp6004c03ypzug2d9at','REC2512-0002',1765404660957,1767996660957,'cmmnqsfog002u03ypst138m6t','RECEIPT',NULL,NULL,88902,7.0,'STANDARD_7',6223,95125,0,0.0,0.0,0,95125,0,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540282,1773336540458,'cmmnqsfqv00cb03yp99tdbv85',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfp7004k03yp9oj3cszj','INV2511-0003',1763728715179,1766320715179,'cmmnqsfoo003503yp4gqmjcw8','TAX_INVOICE',NULL,NULL,45620,7.0,'STANDARD_7',3193,48813,2641,0.0,0.0,0,46172,46172,'PAID',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540284,1773383678481,'cmmnqsfr000cv03ypneda632b',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfp8004r03ypjuhyydkd','DN2512-0003',1764758803496,1767350803496,'cmmnqsfoi002x03ypyfnjsd1q','DEBIT_NOTE',NULL,NULL,68425,7.0,'STANDARD_7',4790,73215,0,0.0,0.0,0,73215,73215,'PAID',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540285,1773336540460,'cmmnqsfqx00cl03ypbgf45iy3',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfp9004y03ypoj6n89tv','CN2603-0001',1773556941343,1776148941343,'cmmnqsfop003603ypqfaggzwg','CREDIT_NOTE',NULL,NULL,63850,7.0,'STANDARD_7',4470,68320,404,0.0,0.0,0,67916,0,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540286,1773383678476,'cmmnqsfqs00c103yp4muw6n1g',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfpb005503ypwsq9ttr3','DN2601-0004',1768986428928,1771578428928,'cmmnqsfoa002n03ypujr9faqw','DEBIT_NOTE',NULL,NULL,41088,7.0,'STANDARD_7',2876,43964,0,0.0,0.0,0,43964,21982,'PARTIAL',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540287,1773383678492,'cmmnqsfrk00fd03ypocp7f845',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfpg005r03ypi2e25asy','INV2603-0006',1772884992332,1775476992332,'cmmnqsfoa002n03ypujr9faqw','TAX_INVOICE',NULL,NULL,42372,7.0,'STANDARD_7',2966,45338,0,0.0,0.0,0,45338,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540292,1773383678485,'cmmnqsfr900dz03yp3s1fyjyd',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfph005z03yphkjwmitz','INV2601-0007',1768693963408,1771285963408,'cmmnqsfoa002n03ypujr9faqw','TAX_INVOICE',NULL,NULL,25448,7.0,'STANDARD_7',1781,27229,2011,0.0,0.0,0,25218,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540293,1773336540462,'cmmnqsfr200d503yp6yn1lru0',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfpi006403ypt5ov1aqw','DN2510-0001',1760866975733,1763458975733,'cmmnqsfod002q03ypq9psp0cp','DELIVERY_NOTE',NULL,NULL,110083,7.0,'STANDARD_7',7706,117789,0,0.0,0.0,0,117789,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540295,1773383678476,'cmmnqsfqu00c603ypcrdkdnlg',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfpj006b03ypn8m3cgb9','INV2601-0008',1769753521145,1772345521145,'cmmnqsfoi002x03ypyfnjsd1q','TAX_INVOICE',NULL,NULL,68896,7.0,'STANDARD_7',4823,73719,2068,0.0,0.0,0,71651,71651,'PAID',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540296,1773336540463,'cmmnqsfr400df03ypt7kcmt0j',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfpl006j03ypuahk2y7r','INV2601-0009',1769473968432,1772065968432,'cmmnqsfol003203yp3w22b07b','TAX_INVOICE',NULL,NULL,46441,7.0,'STANDARD_7',3251,49692,0,0.0,0.0,0,49692,24846,'PARTIAL',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540297,1773336540464,'cmmnqsfr500dk03ypv0e7sqbz',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfpm006q03yp80u4ax9w','INV2602-0010',1769903132957,1772495132957,'cmmnqsfog002u03ypst138m6t','TAX_INVOICE',NULL,NULL,8896,7.0,'STANDARD_7',623,9519,0,0.0,0.0,0,9519,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540298,1773336540465,'cmmnqsfr700dp03yp1cs8g1p4',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfpn006u03ypcwr3fyyr','DN2511-0006',1764313454664,1766905454664,'cmmnqsfoj002z03ypc6lare6g','DEBIT_NOTE',NULL,NULL,119596,7.0,'STANDARD_7',8372,127968,0,0.0,0.0,0,127968,127968,'PAID',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540299,1773336540465,'cmmnqsfr800du03ypkczl4epv',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfpp007803yps62xaqwe','INV2602-0011',1771208524976,1773800524976,'cmmnqsfob002o03yp486systw','TAX_INVOICE',NULL,NULL,40554,7.0,'STANDARD_7',2839,43393,0,0.0,0.0,0,43393,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540302,1773383678498,'cmmnqsfrr00g703yp3lh730ns',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfpq007f03ypwbjx9bmx','DN2602-0007',1772259253477,1774851253477,'cmmnqsfop003603ypqfaggzwg','DEBIT_NOTE',NULL,NULL,13150,7.0,'STANDARD_7',921,14071,788,0.0,0.0,0,13283,13283,'PAID',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540303,1773336540466,'cmmnqsfra00e403ypttkmtmof',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfpr007j03yp8vyrvuzb','REC2510-0004',1761400342929,1763992342929,'cmmnqsfob002o03yp486systw','RECEIPT',NULL,NULL,18480,7.0,'STANDARD_7',1294,19774,0,0.0,0.0,0,19774,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540304,1773383678481,'cmmnqsfr100d003yp6fafylt0',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfpt007n03ypaiar9zyj','DN2512-0008',1765865411626,1768457411626,'cmmnqsfoe002s03yp4hz59isa','DEBIT_NOTE',NULL,NULL,60235,7.0,'STANDARD_7',4216,64451,0,0.0,0.0,0,64451,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540305,1773336540468,'cmmnqsfrc00ee03yphmzihzah',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfpx008403ypetdafb9e','DN2601-0009',1769576434247,1772168434247,'cmmnqsfol003203yp3w22b07b','DEBIT_NOTE',NULL,NULL,70898,7.0,'STANDARD_7',4963,75861,0,0.0,0.0,0,75861,75861,'PAID',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540309,1773336540468,'cmmnqsfrd00ej03ypu7fx1jq5',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfpy008c03ypq0xkqu15','DN2511-0010',1764007184816,1766599184816,'cmmnqsfnv002e03yp578gaiw4','DEBIT_NOTE',NULL,NULL,64594,7.0,'STANDARD_7',4522,69116,5856,0.0,0.0,0,63260,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540311,1773336540469,'cmmnqsfre00eo03yppso33xj8',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfpz008k03yp0167jgtw','REC2603-0006',1774064660917,1776656660917,'cmmnqsfoh002w03ypwdu53urn','RECEIPT',NULL,NULL,67485,7.0,'STANDARD_7',4724,72209,0,0.0,0.0,0,72209,72209,'PAID',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540312,1773336540470,'cmmnqsfrf00et03ypg74evry0',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfq0008r03ypw5e5u2ei','INV2510-0013',1760485893205,1763077893205,'cmmnqsfoj002z03ypc6lare6g','TAX_INVOICE',NULL,NULL,65035,7.0,'STANDARD_7',4552,69587,0,0.0,0.0,0,69587,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540313,1773336540470,'cmmnqsfrg00ey03ypdd0e2r70',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfq4009503yp84v61f9q','INV2512-0014',1765679103118,1768271103118,'cmmnqsfoe002s03yp4hz59isa','TAX_INVOICE',NULL,NULL,90071,7.0,'STANDARD_7',6305,96376,5159,0.0,0.0,0,91217,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540316,1773336540471,'cmmnqsfri00f303yp1vzm9g9n',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfq5009c03yp55u9j6o1','REC2510-0008',1760550986742,1763142986742,'cmmnqsfoa002n03ypujr9faqw','RECEIPT',NULL,NULL,36277,7.0,'STANDARD_7',2539,38816,0,0.0,0.0,0,38816,38816,'PAID',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540317,1773383678489,'cmmnqsfrf00et03ypg74evry0',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfq6009h03yptts3cox9','DN2601-0002',1767951843796,1770543843796,'cmmnqsfol003103ypu3c1ig92','DELIVERY_NOTE',NULL,NULL,15460,7.0,'STANDARD_7',1082,16542,0,0.0,0.0,0,16542,8271,'PARTIAL',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540318,1773383678487,'cmmnqsfrb00e903ypi62g75m2',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfq7009m03yp15zfdyge','INV2602-0015',1769954428485,1772546428485,'cmmnqsfoj002y03ypsybp3mqe','TAX_INVOICE',NULL,NULL,50805,7.0,'STANDARD_7',3556,54361,1198,0.0,0.0,0,53163,53163,'PAID',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540320,1773336540473,'cmmnqsfrl00fi03ypcj5nuoib',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfq8009s03ypxqyjm4pz','INV2602-0016',1771198640188,1773790640188,'cmmnqsfoa002n03ypujr9faqw','TAX_INVOICE',NULL,NULL,7392,7.0,'STANDARD_7',517,7909,165,0.0,0.0,0,7744,7744,'PAID',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540321,1773336540473,'cmmnqsfrm00fn03ypzx8o7yhr',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfqb00a403ypldxipa2c','INV2510-0017',1761164032314,1763756032314,'cmmnqsfoi002x03ypyfnjsd1q','TAX_INVOICE',NULL,NULL,6181,7.0,'STANDARD_7',433,6614,0,0.0,0.0,0,6614,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540323,1773336540474,'cmmnqsfrn00fs03yp424m75ks',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfqc00a903yp2t87650q','DN2511-0003',1764491154041,1767083154041,'cmmnqsfof002t03yp8loq7sxu','DELIVERY_NOTE',NULL,NULL,17270,7.0,'STANDARD_7',1209,18479,0,0.0,0.0,0,18479,0,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540325,1773336540475,'cmmnqsfro00fx03yps7koz1am',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfqf00ai03yph3hfaio4','INV2603-0019',1773591440581,1776183440581,'cmmnqsfom003303ypmto9pwvp','TAX_INVOICE',NULL,NULL,42758,7.0,'STANDARD_7',2993,45751,0,0.0,0.0,0,45751,0,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540327,1773336540475,'cmmnqsfrp00g203ypw1ica78f',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfqh00ao03ypuf401wgj','REC2510-0009',1761214827962,1763806827962,'cmmnqsfol003103ypu3c1ig92','RECEIPT',NULL,NULL,49853,7.0,'STANDARD_7',3490,53343,0,0.0,0.0,0,53343,53343,'PAID',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540329,1773336540476,'cmmnqsfrr00g703yp3lh730ns',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfqi00av03yp43dfughq','INV2601-0020',1769197333109,1771789333109,'cmmnqsfob002o03yp486systw','TAX_INVOICE',NULL,NULL,16257,7.0,'STANDARD_7',1138,17395,0,0.0,0.0,0,17395,0,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540330,1773336540477,'cmmnqsfrs00gc03yp25afqn0m',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfqk00b503ypzh3v681u','DN2602-0004',1771119932680,1773711932680,'cmmnqsfoi002x03ypyfnjsd1q','DELIVERY_NOTE',NULL,NULL,81565,7.0,'STANDARD_7',5710,87275,0,0.0,0.0,0,87275,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540333,1773336540477,'cmmnqsfrt00gh03yps7ang6lp',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfqm00bd03yp9a73vcbr','DN2512-0013',1764941590272,1767533590272,'cmmnqsfnz002g03yphswo9pvl','DEBIT_NOTE',NULL,NULL,28930,7.0,'STANDARD_7',2025,30955,1519,0.0,0.0,0,29436,29436,'PAID',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540334,1773336540478,'cmmnqsfru00gm03ypnlzmbpoo',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfqn00bh03yppvqp4wgg','REC2603-0010',1772852373729,1775444373729,'cmmnqsfol003203yp3w22b07b','RECEIPT',NULL,NULL,72907,7.0,'STANDARD_7',5103,78010,0,0.0,0.0,0,78010,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540335,1773336540478,'cmmnqsfrv00gr03yp9q3ljcls',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmnqsfqo00bo03yp18j8qr8l','REC2510-0011',1761320766732,1763912766732,'cmmnqsfof002t03yp8loq7sxu','RECEIPT',NULL,NULL,80052,7.0,'STANDARD_7',5604,85656,0,0.0,0.0,0,85656,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540337,1773336540479,'cmmnqsfrw00gw03yp0xkzubnw',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiuroz003orqbelvnolffl','REC2602-0001',1771453236717,1774045236717,'cmmnqsfoi002x03ypyfnjsd1q','RECEIPT',NULL,NULL,61153,7.0,'STANDARD_7',4281,65434,0,0.0,0.0,0,65434,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678387,1773383678477,'cmmnqsfqv00cb03yp99tdbv85',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurp0003vrqbeezutrjfv','INV2603-0002',1774767787914,1777359787914,'cmmnqsfob002o03yp486systw','TAX_INVOICE',NULL,NULL,17114,7.0,'STANDARD_7',1198,18312,0,0.0,0.0,0,18312,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678389,1773383678477,'cmmnqsfqw00cg03ypjt4sfh4s',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurp20040rqbetciuf4dq','REC2511-0002',1762445997984,1765037997984,'cmmnqsfoo003503yp4gqmjcw8','RECEIPT',NULL,NULL,66265,7.0,'STANDARD_7',4639,70904,0,0.0,0.0,0,70904,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678390,1773383678479,'cmmnqsfqx00cl03ypbgf45iy3',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurp30048rqbe4fi4fqx5','DN2602-0001',1771358845876,1773950845876,'cmmnqsfoa002n03ypujr9faqw','DELIVERY_NOTE',NULL,NULL,5094,7.0,'STANDARD_7',357,5451,0,0.0,0.0,0,5451,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678391,1773383678480,'cmmnqsfqz00cq03yppe1kv4w4',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurp6004crqbedtet8g4q','INV2510-0005',1761463731539,1764055731539,'cmmnqsfod002q03ypq9psp0cp','TAX_INVOICE',NULL,NULL,51524,7.0,'STANDARD_7',3607,55131,4363,0.0,0.0,0,50768,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678394,1773383678482,'cmmnqsfr200d503yp6yn1lru0',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurp7004irqbevway8cnc','REC2602-0005',1770662945839,1773254945839,'cmmnqsfop003603ypqfaggzwg','RECEIPT',NULL,NULL,51791,7.0,'STANDARD_7',3625,55416,0,0.0,0.0,0,55416,27708,'PARTIAL',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678396,1773383678483,'cmmnqsfr300da03yp5gm4s4wm',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurp9004qrqbe5m5e5657','CN2511-0003',1762692638363,1765284638363,'cmmnqsfod002r03ypnnxspoql','CREDIT_NOTE',NULL,NULL,17609,7.0,'STANDARD_7',1233,18842,175,0.0,0.0,0,18667,9333.5,'PARTIAL',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678397,1773383678483,'cmmnqsfr400df03ypt7kcmt0j',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurpd0058rqbezu0vynpq','DN2603-0003',1774770962510,1777362962510,'cmmnqsfol003103ypu3c1ig92','DEBIT_NOTE',NULL,NULL,146631,7.0,'STANDARD_7',10264,156895,0,0.0,0.0,0,156895,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678401,1773383678484,'cmmnqsfr500dk03ypv0e7sqbz',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurpe005grqbe31i4q2ct','CN2603-0005',1774268855148,1776860855148,'cmmnqsfnz002g03yphswo9pvl','CREDIT_NOTE',NULL,NULL,93610,7.0,'STANDARD_7',6553,100163,0,0.0,0.0,0,100163,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678403,1773383678485,'cmmnqsfr800du03ypkczl4epv',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurpg005orqbecd1d5rfr','INV2602-0007',1772201980517,1774793980517,'cmmnqsfod002r03ypnnxspoql','TAX_INVOICE',NULL,NULL,48782,7.0,'STANDARD_7',3415,52197,1162,0.0,0.0,0,51035,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678404,1773383678486,'cmmnqsfra00e403ypttkmtmof',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurpj005zrqbephmu8n4x','DN2601-0003',1768086885211,1770678885211,'cmmnqsfoe002s03yp4hz59isa','DELIVERY_NOTE',NULL,NULL,80708,7.0,'STANDARD_7',5650,86358,0,0.0,0.0,0,86358,0,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678407,1773383678487,'cmmnqsfrc00ee03yphmzihzah',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurpk0066rqbeppy3wm30','DN2511-0005',1764332437581,1766924437581,'cmmnqsfop003603ypqfaggzwg','DEBIT_NOTE',NULL,NULL,80214,7.0,'STANDARD_7',5615,85829,6725,0.0,0.0,0,79104,39552,'PARTIAL',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678408,1773383678496,'cmmnqsfro00fx03yps7koz1am',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurpl006crqbeyoaqpbnh','REC2603-0007',1773977128986,1776569128986,'cmmnqsfoe002s03yp4hz59isa','RECEIPT',NULL,NULL,11331,7.0,'STANDARD_7',793,12124,0,0.0,0.0,0,12124,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678410,1773383678489,'cmmnqsfre00eo03yppso33xj8',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurpn006grqbe9i61it1x','DN2510-0006',1761620724751,1764212724751,'cmmnqsfoi002x03ypyfnjsd1q','DEBIT_NOTE',NULL,NULL,52927,7.0,'STANDARD_7',3705,56632,0,0.0,0.0,0,56632,56632,'PAID',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678411,1773383678490,'cmmnqsfrg00ey03ypdd0e2r70',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurpo006orqbe0d0va89u','CN2512-0006',1767063117316,1769655117316,'cmmnqsfoh002w03ypwdu53urn','CREDIT_NOTE',NULL,NULL,9100,7.0,'STANDARD_7',637,9737,0,0.0,0.0,0,9737,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678412,1773383678490,'cmmnqsfri00f303yp1vzm9g9n',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurpr006zrqbebhl5nikz','REC2601-0009',1768613434742,1771205434742,'cmmnqsfoc002p03ypyligccx6','RECEIPT',NULL,NULL,46160,7.0,'STANDARD_7',3231,49391,58,0.0,0.0,0,49333,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678416,1773383678491,'cmmnqsfrj00f803yp8zhmdkbk',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurpu0077rqbeklqwexqw','REC2601-0011',1769342834388,1771934834388,'cmmnqsfoj002y03ypsybp3mqe','RECEIPT',NULL,NULL,21060,7.0,'STANDARD_7',1474,22534,0,0.0,0.0,0,22534,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678419,1773383678494,'cmmnqsfrl00fi03ypcj5nuoib',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurpw007brqbexhpl8uil','DN2603-0007',1774508474712,1777100474712,'cmmnqsfoj002z03ypc6lare6g','DEBIT_NOTE',NULL,NULL,10450,7.0,'STANDARD_7',732,11182,0,0.0,0.0,0,11182,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678420,1773383678495,'cmmnqsfrm00fn03ypzx8o7yhr',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurpx007frqbe66prlnzi','INV2510-0009',1759531217842,1762123217842,'cmmnqsfnv002e03yp578gaiw4','TAX_INVOICE',NULL,NULL,69585,7.0,'STANDARD_7',4871,74456,3986,0.0,0.0,0,70470,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678421,1773383678495,'cmmnqsfrn00fs03yp424m75ks',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurq0007prqbehej68nt4','INV2511-0010',1762880078503,1765472078503,'cmmnqsfoc002p03ypyligccx6','TAX_INVOICE',NULL,NULL,17642,7.0,'STANDARD_7',1235,18877,0,0.0,0.0,0,18877,0,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678424,1773383678497,'cmmnqsfrp00g203ypw1ica78f',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurq3007zrqbev0jpergg','CN2512-0007',1767084078674,1769676078674,'cmmnqsfoi002x03ypyfnjsd1q','CREDIT_NOTE',NULL,NULL,9649,7.0,'STANDARD_7',675,10324,0,0.0,0.0,0,10324,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678427,1773383678499,'cmmnqsfrs00gc03yp25afqn0m',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurq6008arqbe3vxl4f9w','REC2512-0015',1765798633488,1768390633488,'cmmnqsfog002u03ypst138m6t','RECEIPT',NULL,NULL,67831,7.0,'STANDARD_7',4748,72579,0,0.0,0.0,0,72579,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678430,1773383678500,'cmmnqsfrt00gh03yps7ang6lp',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurqc008mrqbeszm7cdd7','INV2512-0012',1765685239102,1768277239102,'cmmnqsfof002t03yp8loq7sxu','TAX_INVOICE',NULL,NULL,92732,7.0,'STANDARD_7',6491,99223,0,0.0,0.0,0,99223,0,'ISSUED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678436,1773383678501,'cmmnqsfru00gm03ypnlzmbpoo',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurqf008yrqbet1irrr7k','DN2601-0006',1769493983806,1772085983806,'cmmnqsfob002o03yp486systw','DELIVERY_NOTE',NULL,NULL,90312,7.0,'STANDARD_7',6322,96634,0,0.0,0.0,0,96634,0,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678439,1773383678501,'cmmnqsfrv00gr03yp9q3ljcls',NULL,1.0,NULL);
INSERT INTO Invoice VALUES('cmmoiurqg0095rqbed8ceylpa','CN2601-0010',1767577293753,1770169293753,'cmmnqsfom003303ypmto9pwvp','CREDIT_NOTE',NULL,NULL,3543,7.0,'STANDARD_7',248,3791,66,0.0,0.0,0,3725,1862.5,'PARTIAL',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773383678440,1773383678502,'cmmnqsfrw00gw03yp0xkzubnw',NULL,1.0,NULL);
CREATE TABLE IF NOT EXISTS "InvoiceLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'ชิ้น',
    "unitPrice" INTEGER NOT NULL DEFAULT 0,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "vatRate" REAL NOT NULL DEFAULT 7,
    "vatAmount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvoiceLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO InvoiceLine VALUES('cmmnqsfoz003i03ypxwsnk2ve','cmmnqsfoz003g03yp4r7law0j',1,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',4.0,'ครั้ง',2151,0,8604,7.0,602,NULL,1773336540275,1773336540275);
INSERT INTO InvoiceLine VALUES('cmmnqsfoz003j03yp70ywk0rk','cmmnqsfoz003g03yp4r7law0j',2,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',9.0,'ครั้ง',3121,0,28089,7.0,1966,NULL,1773336540275,1773336540275);
INSERT INTO InvoiceLine VALUES('cmmnqsfoz003k03ypwhmm556t','cmmnqsfoz003g03yp4r7law0j',3,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',5.0,'ครั้ง',1429,0,7145,7.0,500,NULL,1773336540275,1773336540275);
INSERT INTO InvoiceLine VALUES('cmmnqsfoz003l03ypayl2zhel','cmmnqsfoz003g03yp4r7law0j',4,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',4.0,'ชุด',2602,0,10408,7.0,729,NULL,1773336540275,1773336540275);
INSERT INTO InvoiceLine VALUES('cmmnqsfp5004703yphkqihr5w','cmmnqsfp5004503ypuaort8fa',1,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',5.0,'ครั้ง',1227,0,6135,7.0,429,NULL,1773336540281,1773336540281);
INSERT INTO InvoiceLine VALUES('cmmnqsfp5004803ypdsmhrlo7','cmmnqsfp5004503ypuaort8fa',2,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',2.0,'ครั้ง',1240,0,2480,7.0,174,NULL,1773336540281,1773336540281);
INSERT INTO InvoiceLine VALUES('cmmnqsfp5004903ypytdlsgvv','cmmnqsfp5004503ypuaort8fa',3,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',4.0,'ชุด',4593,0,18372,7.0,1286,NULL,1773336540281,1773336540281);
INSERT INTO InvoiceLine VALUES('cmmnqsfp5004a03ypwpgpkq4j','cmmnqsfp5004503ypuaort8fa',4,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',10.0,'ชุด',1010,0,10100,7.0,707,NULL,1773336540281,1773336540281);
INSERT INTO InvoiceLine VALUES('cmmnqsfp6004e03yp4xkdzsff','cmmnqsfp6004c03ypzug2d9at',1,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',2.0,'ครั้ง',2963,0,5926,7.0,415,NULL,1773336540282,1773336540282);
INSERT INTO InvoiceLine VALUES('cmmnqsfp6004f03ypeqce0bet','cmmnqsfp6004c03ypzug2d9at',2,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',5.0,'ชุด',4313,0,21565,7.0,1510,NULL,1773336540282,1773336540282);
INSERT INTO InvoiceLine VALUES('cmmnqsfp6004g03ypfmni4tyd','cmmnqsfp6004c03ypzug2d9at',3,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',9.0,'ครั้ง',4185,0,37665,7.0,2637,NULL,1773336540282,1773336540282);
INSERT INTO InvoiceLine VALUES('cmmnqsfp6004h03ypn1upr72i','cmmnqsfp6004c03ypzug2d9at',4,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',2.0,'ครั้ง',2975,0,5950,7.0,417,NULL,1773336540282,1773336540282);
INSERT INTO InvoiceLine VALUES('cmmnqsfp6004i03ypg8uprh94','cmmnqsfp6004c03ypzug2d9at',5,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',6.0,'ชิ้น',2966,0,17796,7.0,1246,NULL,1773336540282,1773336540282);
INSERT INTO InvoiceLine VALUES('cmmnqsfp7004m03ypnc9y3yya','cmmnqsfp7004k03yp9oj3cszj',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',7.0,'ชิ้น',5120,0,35840,7.0,2509,NULL,1773336540284,1773336540284);
INSERT INTO InvoiceLine VALUES('cmmnqsfp7004n03ypys4j0msi','cmmnqsfp7004k03yp9oj3cszj',2,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',1.0,'ชิ้น',5035,0,5035,7.0,352,NULL,1773336540284,1773336540284);
INSERT INTO InvoiceLine VALUES('cmmnqsfp7004o03ypxn6xrl3f','cmmnqsfp7004k03yp9oj3cszj',3,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',2.0,'ชุด',1681,0,3362,7.0,235,NULL,1773336540284,1773336540284);
INSERT INTO InvoiceLine VALUES('cmmnqsfp7004p03ypgbpr2xaq','cmmnqsfp7004k03yp9oj3cszj',4,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',1.0,'ครั้ง',1383,0,1383,7.0,97,NULL,1773336540284,1773336540284);
INSERT INTO InvoiceLine VALUES('cmmnqsfp8004t03ypk9tmuz5m','cmmnqsfp8004r03ypjuhyydkd',1,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',3.0,'ครั้ง',3494,0,10482,7.0,734,NULL,1773336540285,1773336540285);
INSERT INTO InvoiceLine VALUES('cmmnqsfp8004u03ypifgobmup','cmmnqsfp8004r03ypjuhyydkd',2,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',2.0,'ชิ้น',791,0,1582,7.0,111,NULL,1773336540285,1773336540285);
INSERT INTO InvoiceLine VALUES('cmmnqsfp8004v03yptxvemjnc','cmmnqsfp8004r03ypjuhyydkd',3,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',4.0,'ครั้ง',5314,0,21256,7.0,1488,NULL,1773336540285,1773336540285);
INSERT INTO InvoiceLine VALUES('cmmnqsfp8004w03ypc3qacujv','cmmnqsfp8004r03ypjuhyydkd',4,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',7.0,'ครั้ง',5015,0,35105,7.0,2457,NULL,1773336540285,1773336540285);
INSERT INTO InvoiceLine VALUES('cmmnqsfpa005003ypgbh6374t','cmmnqsfp9004y03ypoj6n89tv',1,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',3.0,'ครั้ง',1766,0,5298,7.0,371,NULL,1773336540286,1773336540286);
INSERT INTO InvoiceLine VALUES('cmmnqsfpa005103ypsvsgbc3f','cmmnqsfp9004y03ypoj6n89tv',2,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',6.0,'ครั้ง',5022,0,30132,7.0,2109,NULL,1773336540286,1773336540286);
INSERT INTO InvoiceLine VALUES('cmmnqsfpa005203ypzz1mw6jz','cmmnqsfp9004y03ypoj6n89tv',3,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',4.0,'ครั้ง',1826,0,7304,7.0,511,NULL,1773336540286,1773336540286);
INSERT INTO InvoiceLine VALUES('cmmnqsfpa005303yppwrfv096','cmmnqsfp9004y03ypoj6n89tv',4,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',4.0,'ชุด',5279,0,21116,7.0,1478,NULL,1773336540286,1773336540286);
INSERT INTO InvoiceLine VALUES('cmmnqsfpb005703ypwswq1ru2','cmmnqsfpb005503ypwsq9ttr3',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',4.0,'ชิ้น',2536,0,10144,7.0,710,NULL,1773336540287,1773336540287);
INSERT INTO InvoiceLine VALUES('cmmnqsfpb005803ypw71yosgd','cmmnqsfpb005503ypwsq9ttr3',2,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',1.0,'ครั้ง',2008,0,2008,7.0,141,NULL,1773336540287,1773336540287);
INSERT INTO InvoiceLine VALUES('cmmnqsfpb005903ypkadlj1ty','cmmnqsfpb005503ypwsq9ttr3',3,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',6.0,'ครั้ง',4699,0,28194,7.0,1974,NULL,1773336540287,1773336540287);
INSERT INTO InvoiceLine VALUES('cmmnqsfpb005a03ypci039n11','cmmnqsfpb005503ypwsq9ttr3',4,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',1.0,'ครั้ง',742,0,742,7.0,52,NULL,1773336540287,1773336540287);
INSERT INTO InvoiceLine VALUES('cmmnqsfpg005t03yp4tjoht1g','cmmnqsfpg005r03ypi2e25asy',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',1.0,'ชิ้น',2271,0,2271,7.0,159,NULL,1773336540292,1773336540292);
INSERT INTO InvoiceLine VALUES('cmmnqsfpg005u03ypvxed8v8c','cmmnqsfpg005r03ypi2e25asy',2,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',6.0,'ชิ้น',3897,0,23382,7.0,1637,NULL,1773336540292,1773336540292);
INSERT INTO InvoiceLine VALUES('cmmnqsfpg005v03ypu0w26k5g','cmmnqsfpg005r03ypi2e25asy',3,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',1.0,'ครั้ง',2680,0,2680,7.0,188,NULL,1773336540292,1773336540292);
INSERT INTO InvoiceLine VALUES('cmmnqsfpg005w03yp5eskla75','cmmnqsfpg005r03ypi2e25asy',4,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',10.0,'ครั้ง',503,0,5030,7.0,352,NULL,1773336540292,1773336540292);
INSERT INTO InvoiceLine VALUES('cmmnqsfpg005x03ypz1enn5nd','cmmnqsfpg005r03ypi2e25asy',5,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',3.0,'ชิ้น',3003,0,9009,7.0,631,NULL,1773336540292,1773336540292);
INSERT INTO InvoiceLine VALUES('cmmnqsfph006103ypg0cco4cv','cmmnqsfph005z03yphkjwmitz',1,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',5.0,'ครั้ง',3812,0,19060,7.0,1334,NULL,1773336540293,1773336540293);
INSERT INTO InvoiceLine VALUES('cmmnqsfph006203yp2rc5ljdd','cmmnqsfph005z03yphkjwmitz',2,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',4.0,'ครั้ง',1597,0,6388,7.0,447,NULL,1773336540293,1773336540293);
INSERT INTO InvoiceLine VALUES('cmmnqsfpi006603ypkcetav9b','cmmnqsfpi006403ypt5ov1aqw',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',7.0,'ชิ้น',2582,0,18074,7.0,1265,NULL,1773336540295,1773336540295);
INSERT INTO InvoiceLine VALUES('cmmnqsfpi006703ypi7puk9jx','cmmnqsfpi006403ypt5ov1aqw',2,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',10.0,'ชุด',4640,0,46400,7.0,3248,NULL,1773336540295,1773336540295);
INSERT INTO InvoiceLine VALUES('cmmnqsfpi006803ypozrckuff','cmmnqsfpi006403ypt5ov1aqw',3,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',7.0,'ครั้ง',5417,0,37919,7.0,2654,NULL,1773336540295,1773336540295);
INSERT INTO InvoiceLine VALUES('cmmnqsfpi006903ypk7f58sho','cmmnqsfpi006403ypt5ov1aqw',4,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',2.0,'ครั้ง',3845,0,7690,7.0,538,NULL,1773336540295,1773336540295);
INSERT INTO InvoiceLine VALUES('cmmnqsfpj006d03yp58cwbubs','cmmnqsfpj006b03ypn8m3cgb9',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',1.0,'ชิ้น',874,0,874,7.0,61,NULL,1773336540296,1773336540296);
INSERT INTO InvoiceLine VALUES('cmmnqsfpj006e03ypcfyl88jl','cmmnqsfpj006b03ypn8m3cgb9',2,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',8.0,'ชุด',1332,0,10656,7.0,746,NULL,1773336540296,1773336540296);
INSERT INTO InvoiceLine VALUES('cmmnqsfpj006f03ypiu326d07','cmmnqsfpj006b03ypn8m3cgb9',3,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',6.0,'ชุด',3446,0,20676,7.0,1447,NULL,1773336540296,1773336540296);
INSERT INTO InvoiceLine VALUES('cmmnqsfpj006g03ypb9zhp9zs','cmmnqsfpj006b03ypn8m3cgb9',4,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',10.0,'ชุด',2638,0,26380,7.0,1847,NULL,1773336540296,1773336540296);
INSERT INTO InvoiceLine VALUES('cmmnqsfpj006h03ypipeqqbtc','cmmnqsfpj006b03ypn8m3cgb9',5,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',2.0,'ชุด',5155,0,10310,7.0,722,NULL,1773336540296,1773336540296);
INSERT INTO InvoiceLine VALUES('cmmnqsfpl006l03ypm1ruh93c','cmmnqsfpl006j03ypuahk2y7r',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',2.0,'ชิ้น',5148,0,10296,7.0,721,NULL,1773336540297,1773336540297);
INSERT INTO InvoiceLine VALUES('cmmnqsfpl006m03ypu46l6ibc','cmmnqsfpl006j03ypuahk2y7r',2,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',2.0,'ครั้ง',4360,0,8720,7.0,610,NULL,1773336540297,1773336540297);
INSERT INTO InvoiceLine VALUES('cmmnqsfpl006n03yp3pzsm5uy','cmmnqsfpl006j03ypuahk2y7r',3,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',5.0,'ชุด',529,0,2645,7.0,185,NULL,1773336540297,1773336540297);
INSERT INTO InvoiceLine VALUES('cmmnqsfpl006o03yp0a27mj2w','cmmnqsfpl006j03ypuahk2y7r',4,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',10.0,'ครั้ง',2478,0,24780,7.0,1735,NULL,1773336540297,1773336540297);
INSERT INTO InvoiceLine VALUES('cmmnqsfpm006s03ypnmx89lap','cmmnqsfpm006q03yp80u4ax9w',1,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',2.0,'ชุด',4448,0,8896,7.0,623,NULL,1773336540298,1773336540298);
INSERT INTO InvoiceLine VALUES('cmmnqsfpn006w03ypdpu77g7t','cmmnqsfpn006u03ypcwr3fyyr',1,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',10.0,'ครั้ง',1743,0,17430,7.0,1220,NULL,1773336540299,1773336540299);
INSERT INTO InvoiceLine VALUES('cmmnqsfpn006x03ypdqzz69lo','cmmnqsfpn006u03ypcwr3fyyr',2,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',8.0,'ครั้ง',2682,0,21456,7.0,1502,NULL,1773336540299,1773336540299);
INSERT INTO InvoiceLine VALUES('cmmnqsfpn006y03yp0504p5qy','cmmnqsfpn006u03ypcwr3fyyr',3,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',7.0,'ชุด',3630,0,25410,7.0,1779,NULL,1773336540299,1773336540299);
INSERT INTO InvoiceLine VALUES('cmmnqsfpn006z03yp2tyesgd3','cmmnqsfpn006u03ypcwr3fyyr',4,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',8.0,'ชุด',4935,0,39480,7.0,2764,NULL,1773336540299,1773336540299);
INSERT INTO InvoiceLine VALUES('cmmnqsfpn007003ypw6itqjlt','cmmnqsfpn006u03ypcwr3fyyr',5,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',5.0,'ครั้ง',3164,0,15820,7.0,1107,NULL,1773336540299,1773336540299);
INSERT INTO InvoiceLine VALUES('cmmnqsfpp007a03yppxkrjr77','cmmnqsfpp007803yps62xaqwe',1,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',5.0,'ครั้ง',3083,0,15415,7.0,1079,NULL,1773336540302,1773336540302);
INSERT INTO InvoiceLine VALUES('cmmnqsfpp007b03ypqnfbojot','cmmnqsfpp007803yps62xaqwe',2,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',2.0,'ชิ้น',1100,0,2200,7.0,154,NULL,1773336540302,1773336540302);
INSERT INTO InvoiceLine VALUES('cmmnqsfpp007c03yprp9fb2f2','cmmnqsfpp007803yps62xaqwe',3,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',8.0,'ชุด',1933,0,15464,7.0,1082,NULL,1773336540302,1773336540302);
INSERT INTO InvoiceLine VALUES('cmmnqsfpp007d03yp7b4bda4q','cmmnqsfpp007803yps62xaqwe',4,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',5.0,'ชุด',1495,0,7475,7.0,523,NULL,1773336540302,1773336540302);
INSERT INTO InvoiceLine VALUES('cmmnqsfpr007h03yptqlmflzl','cmmnqsfpq007f03ypwbjx9bmx',1,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',10.0,'ชุด',1315,0,13150,7.0,921,NULL,1773336540303,1773336540303);
INSERT INTO InvoiceLine VALUES('cmmnqsfps007l03ypetpzijpx','cmmnqsfpr007j03yp8vyrvuzb',1,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',8.0,'ครั้ง',2310,0,18480,7.0,1294,NULL,1773336540304,1773336540304);
INSERT INTO InvoiceLine VALUES('cmmnqsfpt007p03ypy9idkcvk','cmmnqsfpt007n03ypaiar9zyj',1,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',4.0,'ชุด',3865,0,15460,7.0,1082,NULL,1773336540305,1773336540305);
INSERT INTO InvoiceLine VALUES('cmmnqsfpt007q03ypbiiw0enc','cmmnqsfpt007n03ypaiar9zyj',2,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',5.0,'ครั้ง',4128,0,20640,7.0,1445,NULL,1773336540305,1773336540305);
INSERT INTO InvoiceLine VALUES('cmmnqsfpt007r03ypzsoqqbk0','cmmnqsfpt007n03ypaiar9zyj',3,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',5.0,'ครั้ง',2181,0,10905,7.0,763,NULL,1773336540305,1773336540305);
INSERT INTO InvoiceLine VALUES('cmmnqsfpt007s03ypthgfbb7z','cmmnqsfpt007n03ypaiar9zyj',4,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',5.0,'ชิ้น',2646,0,13230,7.0,926,NULL,1773336540305,1773336540305);
INSERT INTO InvoiceLine VALUES('cmmnqsfpx008603ypg7a4f5an','cmmnqsfpx008403ypetdafb9e',1,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',8.0,'ชุด',2486,0,19888,7.0,1392,NULL,1773336540309,1773336540309);
INSERT INTO InvoiceLine VALUES('cmmnqsfpx008703ypyxfib8f5','cmmnqsfpx008403ypetdafb9e',2,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',3.0,'ชิ้น',5029,0,15087,7.0,1056,NULL,1773336540309,1773336540309);
INSERT INTO InvoiceLine VALUES('cmmnqsfpx008803ypmlsfxv2c','cmmnqsfpx008403ypetdafb9e',3,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',1.0,'ครั้ง',2010,0,2010,7.0,141,NULL,1773336540309,1773336540309);
INSERT INTO InvoiceLine VALUES('cmmnqsfpx008903ypzx7zxtrm','cmmnqsfpx008403ypetdafb9e',4,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',8.0,'ชุด',3263,0,26104,7.0,1827,NULL,1773336540309,1773336540309);
INSERT INTO InvoiceLine VALUES('cmmnqsfpx008a03ypsdzpu81u','cmmnqsfpx008403ypetdafb9e',5,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',3.0,'ชิ้น',2603,0,7809,7.0,547,NULL,1773336540309,1773336540309);
INSERT INTO InvoiceLine VALUES('cmmnqsfpy008e03ypreho9w08','cmmnqsfpy008c03ypq0xkqu15',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',7.0,'ชิ้น',2542,0,17794,7.0,1246,NULL,1773336540311,1773336540311);
INSERT INTO InvoiceLine VALUES('cmmnqsfpy008f03ypn2xzg5d4','cmmnqsfpy008c03ypq0xkqu15',2,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',6.0,'ครั้ง',1999,0,11994,7.0,840,NULL,1773336540311,1773336540311);
INSERT INTO InvoiceLine VALUES('cmmnqsfpy008g03ypx2atmzbh','cmmnqsfpy008c03ypq0xkqu15',3,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',2.0,'ชุด',2143,0,4286,7.0,300,NULL,1773336540311,1773336540311);
INSERT INTO InvoiceLine VALUES('cmmnqsfpy008h03ypgc93ju9p','cmmnqsfpy008c03ypq0xkqu15',4,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',4.0,'ครั้ง',2940,0,11760,7.0,823,NULL,1773336540311,1773336540311);
INSERT INTO InvoiceLine VALUES('cmmnqsfpy008i03yp4mpmq752','cmmnqsfpy008c03ypq0xkqu15',5,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',7.0,'ชิ้น',2680,0,18760,7.0,1313,NULL,1773336540311,1773336540311);
INSERT INTO InvoiceLine VALUES('cmmnqsfpz008m03yp9t8k0hz6','cmmnqsfpz008k03yp0167jgtw',1,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',1.0,'ครั้ง',4565,0,4565,7.0,320,NULL,1773336540312,1773336540312);
INSERT INTO InvoiceLine VALUES('cmmnqsfpz008n03yp7otztf9e','cmmnqsfpz008k03yp0167jgtw',2,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',7.0,'ชิ้น',3808,0,26656,7.0,1866,NULL,1773336540312,1773336540312);
INSERT INTO InvoiceLine VALUES('cmmnqsfpz008o03ypung84trs','cmmnqsfpz008k03yp0167jgtw',3,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',6.0,'ชุด',4038,0,24228,7.0,1696,NULL,1773336540312,1773336540312);
INSERT INTO InvoiceLine VALUES('cmmnqsfpz008p03ypnw6qu0te','cmmnqsfpz008k03yp0167jgtw',4,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',4.0,'ชิ้น',3009,0,12036,7.0,843,NULL,1773336540312,1773336540312);
INSERT INTO InvoiceLine VALUES('cmmnqsfq1008t03yps64nwapn','cmmnqsfq0008r03ypw5e5u2ei',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',1.0,'ชิ้น',2485,0,2485,7.0,174,NULL,1773336540313,1773336540313);
INSERT INTO InvoiceLine VALUES('cmmnqsfq1008u03yphn4ddrd4','cmmnqsfq0008r03ypw5e5u2ei',2,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',1.0,'ครั้ง',4134,0,4134,7.0,289,NULL,1773336540313,1773336540313);
INSERT INTO InvoiceLine VALUES('cmmnqsfq1008v03ypt71qv37e','cmmnqsfq0008r03ypw5e5u2ei',3,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',5.0,'ชิ้น',2192,0,10960,7.0,767,NULL,1773336540313,1773336540313);
INSERT INTO InvoiceLine VALUES('cmmnqsfq1008w03ypdljtt5f3','cmmnqsfq0008r03ypw5e5u2ei',4,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',9.0,'ชุด',4303,0,38727,7.0,2711,NULL,1773336540313,1773336540313);
INSERT INTO InvoiceLine VALUES('cmmnqsfq1008x03yps69uulbv','cmmnqsfq0008r03ypw5e5u2ei',5,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',7.0,'ชุด',1247,0,8729,7.0,611,NULL,1773336540313,1773336540313);
INSERT INTO InvoiceLine VALUES('cmmnqsfq4009703ypevx8wyys','cmmnqsfq4009503yp84v61f9q',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',5.0,'ชิ้น',4564,0,22820,7.0,1597,NULL,1773336540316,1773336540316);
INSERT INTO InvoiceLine VALUES('cmmnqsfq4009803ypoyhm8501','cmmnqsfq4009503yp84v61f9q',2,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',8.0,'ชิ้น',1860,0,14880,7.0,1042,NULL,1773336540316,1773336540316);
INSERT INTO InvoiceLine VALUES('cmmnqsfq4009903ypczygao58','cmmnqsfq4009503yp84v61f9q',3,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',3.0,'ชิ้น',1992,0,5976,7.0,418,NULL,1773336540316,1773336540316);
INSERT INTO InvoiceLine VALUES('cmmnqsfq4009a03ypoyxrj343','cmmnqsfq4009503yp84v61f9q',4,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',9.0,'ครั้ง',5155,0,46395,7.0,3248,NULL,1773336540316,1773336540316);
INSERT INTO InvoiceLine VALUES('cmmnqsfq5009e03yp6s236as6','cmmnqsfq5009c03yp55u9j6o1',1,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',7.0,'ชุด',4938,0,34566,7.0,2420,NULL,1773336540317,1773336540317);
INSERT INTO InvoiceLine VALUES('cmmnqsfq5009f03yprxibnc6e','cmmnqsfq5009c03yp55u9j6o1',2,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',1.0,'ชุด',1711,0,1711,7.0,120,NULL,1773336540317,1773336540317);
INSERT INTO InvoiceLine VALUES('cmmnqsfq6009j03yp4alz6zvi','cmmnqsfq6009h03yptts3cox9',1,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',10.0,'ชุด',609,0,6090,7.0,426,NULL,1773336540318,1773336540318);
INSERT INTO InvoiceLine VALUES('cmmnqsfq6009k03ypwqqvacpo','cmmnqsfq6009h03yptts3cox9',2,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',5.0,'ชิ้น',1874,0,9370,7.0,656,NULL,1773336540318,1773336540318);
INSERT INTO InvoiceLine VALUES('cmmnqsfq7009o03yp8i9fzivn','cmmnqsfq7009m03yp15zfdyge',1,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',1.0,'ชุด',3705,0,3705,7.0,259,NULL,1773336540320,1773336540320);
INSERT INTO InvoiceLine VALUES('cmmnqsfq7009p03ypvz6iylql','cmmnqsfq7009m03yp15zfdyge',2,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',7.0,'ชุด',3270,0,22890,7.0,1602,NULL,1773336540320,1773336540320);
INSERT INTO InvoiceLine VALUES('cmmnqsfq7009q03yprri2sru6','cmmnqsfq7009m03yp15zfdyge',3,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',10.0,'ชุด',2421,0,24210,7.0,1695,NULL,1773336540320,1773336540320);
INSERT INTO InvoiceLine VALUES('cmmnqsfq8009u03ypxmueqvqb','cmmnqsfq8009s03ypxqyjm4pz',1,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',1.0,'ครั้ง',2862,0,2862,7.0,200,NULL,1773336540321,1773336540321);
INSERT INTO InvoiceLine VALUES('cmmnqsfq8009v03ypos3ohj97','cmmnqsfq8009s03ypxqyjm4pz',2,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',2.0,'ครั้ง',2265,0,4530,7.0,317,NULL,1773336540321,1773336540321);
INSERT INTO InvoiceLine VALUES('cmmnqsfqb00a603ypw8v20yzw','cmmnqsfqb00a403ypldxipa2c',1,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',2.0,'ครั้ง',2308,0,4616,7.0,323,NULL,1773336540323,1773336540323);
INSERT INTO InvoiceLine VALUES('cmmnqsfqb00a703ypj6w9mh8h','cmmnqsfqb00a403ypldxipa2c',2,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',1.0,'ครั้ง',1565,0,1565,7.0,110,NULL,1773336540323,1773336540323);
INSERT INTO InvoiceLine VALUES('cmmnqsfqc00ab03ypasn477ia','cmmnqsfqc00a903yp2t87650q',1,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',3.0,'ครั้ง',3135,0,9405,7.0,658,NULL,1773336540325,1773336540325);
INSERT INTO InvoiceLine VALUES('cmmnqsfqc00ac03ypas414iez','cmmnqsfqc00a903yp2t87650q',2,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',5.0,'ชุด',1573,0,7865,7.0,551,NULL,1773336540325,1773336540325);
INSERT INTO InvoiceLine VALUES('cmmnqsfqf00ak03ypb3l97fnz','cmmnqsfqf00ai03yph3hfaio4',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',4.0,'ชิ้น',3641,0,14564,7.0,1019,NULL,1773336540327,1773336540327);
INSERT INTO InvoiceLine VALUES('cmmnqsfqf00al03ypw7mxqy93','cmmnqsfqf00ai03yph3hfaio4',2,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',6.0,'ชุด',2477,0,14862,7.0,1040,NULL,1773336540327,1773336540327);
INSERT INTO InvoiceLine VALUES('cmmnqsfqf00am03yp9u1ems4n','cmmnqsfqf00ai03yph3hfaio4',3,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',6.0,'ครั้ง',2222,0,13332,7.0,933,NULL,1773336540327,1773336540327);
INSERT INTO InvoiceLine VALUES('cmmnqsfqh00aq03ypgzjy324t','cmmnqsfqh00ao03ypuf401wgj',1,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',7.0,'ครั้ง',4991,0,34937,7.0,2446,NULL,1773336540329,1773336540329);
INSERT INTO InvoiceLine VALUES('cmmnqsfqh00ar03ypdot5c00z','cmmnqsfqh00ao03ypuf401wgj',2,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',1.0,'ชุด',3318,0,3318,7.0,232,NULL,1773336540329,1773336540329);
INSERT INTO InvoiceLine VALUES('cmmnqsfqh00as03yp2bwtlo0g','cmmnqsfqh00ao03ypuf401wgj',3,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',2.0,'ครั้ง',5113,0,10226,7.0,716,NULL,1773336540329,1773336540329);
INSERT INTO InvoiceLine VALUES('cmmnqsfqh00at03yp3fv9ys1t','cmmnqsfqh00ao03ypuf401wgj',4,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',1.0,'ครั้ง',1372,0,1372,7.0,96,NULL,1773336540329,1773336540329);
INSERT INTO InvoiceLine VALUES('cmmnqsfqi00ax03ypeizugrs6','cmmnqsfqi00av03yp43dfughq',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',3.0,'ชิ้น',5419,0,16257,7.0,1138,NULL,1773336540330,1773336540330);
INSERT INTO InvoiceLine VALUES('cmmnqsfql00b703ypg20h9jid','cmmnqsfqk00b503ypzh3v681u',1,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',3.0,'ชุด',5368,0,16104,7.0,1127,NULL,1773336540333,1773336540333);
INSERT INTO InvoiceLine VALUES('cmmnqsfql00b803ypkw2xjtfi','cmmnqsfqk00b503ypzh3v681u',2,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',5.0,'ชิ้น',2690,0,13450,7.0,942,NULL,1773336540333,1773336540333);
INSERT INTO InvoiceLine VALUES('cmmnqsfql00b903yp11967xyc','cmmnqsfqk00b503ypzh3v681u',3,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',3.0,'ชิ้น',3098,0,9294,7.0,651,NULL,1773336540333,1773336540333);
INSERT INTO InvoiceLine VALUES('cmmnqsfql00ba03yp2w48zpz6','cmmnqsfqk00b503ypzh3v681u',4,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',7.0,'ชิ้น',4167,0,29169,7.0,2042,NULL,1773336540333,1773336540333);
INSERT INTO InvoiceLine VALUES('cmmnqsfql00bb03yp65fauim8','cmmnqsfqk00b503ypzh3v681u',5,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',3.0,'ครั้ง',4516,0,13548,7.0,948,NULL,1773336540333,1773336540333);
INSERT INTO InvoiceLine VALUES('cmmnqsfqm00bf03yputlflbh6','cmmnqsfqm00bd03yp9a73vcbr',1,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',10.0,'ชุด',2893,0,28930,7.0,2025,NULL,1773336540334,1773336540334);
INSERT INTO InvoiceLine VALUES('cmmnqsfqn00bj03ypbe5x71ng','cmmnqsfqn00bh03yppvqp4wgg',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',5.0,'ชิ้น',1712,0,8560,7.0,599,NULL,1773336540335,1773336540335);
INSERT INTO InvoiceLine VALUES('cmmnqsfqn00bk03ypazzwn5uu','cmmnqsfqn00bh03yppvqp4wgg',2,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',7.0,'ชิ้น',1194,0,8358,7.0,585,NULL,1773336540335,1773336540335);
INSERT INTO InvoiceLine VALUES('cmmnqsfqn00bl03yp98dqdnz2','cmmnqsfqn00bh03yppvqp4wgg',3,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',3.0,'ครั้ง',2646,0,7938,7.0,556,NULL,1773336540335,1773336540335);
INSERT INTO InvoiceLine VALUES('cmmnqsfqn00bm03ypif2fwfum','cmmnqsfqn00bh03yppvqp4wgg',4,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',9.0,'ชุด',5339,0,48051,7.0,3364,NULL,1773336540335,1773336540335);
INSERT INTO InvoiceLine VALUES('cmmnqsfqo00bq03ypxbsfpmtl','cmmnqsfqo00bo03yp18j8qr8l',1,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',5.0,'ครั้ง',1700,0,8500,7.0,595,NULL,1773336540337,1773336540337);
INSERT INTO InvoiceLine VALUES('cmmnqsfqo00br03ypwy8eeqkh','cmmnqsfqo00bo03yp18j8qr8l',2,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',6.0,'ชุด',5452,0,32712,7.0,2290,NULL,1773336540337,1773336540337);
INSERT INTO InvoiceLine VALUES('cmmnqsfqo00bs03ypack17a3b','cmmnqsfqo00bo03yp18j8qr8l',3,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',8.0,'ครั้ง',4170,0,33360,7.0,2335,NULL,1773336540337,1773336540337);
INSERT INTO InvoiceLine VALUES('cmmnqsfqo00bt03ypptf5irce','cmmnqsfqo00bo03yp18j8qr8l',4,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',4.0,'ชิ้น',1370,0,5480,7.0,384,NULL,1773336540337,1773336540337);
INSERT INTO InvoiceLine VALUES('cmmoiuroz003qrqbeej313jr9','cmmoiuroz003orqbelvnolffl',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',7.0,'ชิ้น',4395,0,30765,7.0,2154,NULL,1773383678387,1773383678387);
INSERT INTO InvoiceLine VALUES('cmmoiuroz003rrqbeowj0ixyq','cmmoiuroz003orqbelvnolffl',2,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',8.0,'ครั้ง',683,0,5464,7.0,382,NULL,1773383678387,1773383678387);
INSERT INTO InvoiceLine VALUES('cmmoiuroz003srqbeag5imowj','cmmoiuroz003orqbelvnolffl',3,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',9.0,'ชิ้น',1691,0,15219,7.0,1065,NULL,1773383678387,1773383678387);
INSERT INTO InvoiceLine VALUES('cmmoiuroz003trqbeahr59zbe','cmmoiuroz003orqbelvnolffl',4,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',3.0,'ชุด',3235,0,9705,7.0,679,NULL,1773383678387,1773383678387);
INSERT INTO InvoiceLine VALUES('cmmoiurp0003xrqbe5c99t1nn','cmmoiurp0003vrqbeezutrjfv',1,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',2.0,'ชุด',3175,0,6350,7.0,445,NULL,1773383678389,1773383678389);
INSERT INTO InvoiceLine VALUES('cmmoiurp0003yrqbetaj8ledx','cmmoiurp0003vrqbeezutrjfv',2,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',3.0,'ครั้ง',3588,0,10764,7.0,753,NULL,1773383678389,1773383678389);
INSERT INTO InvoiceLine VALUES('cmmoiurp20042rqbelgruynsn','cmmoiurp20040rqbetciuf4dq',1,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',6.0,'ครั้ง',970,0,5820,7.0,407,NULL,1773383678390,1773383678390);
INSERT INTO InvoiceLine VALUES('cmmoiurp20043rqbepbkenrph','cmmoiurp20040rqbetciuf4dq',2,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',4.0,'ครั้ง',4325,0,17300,7.0,1211,NULL,1773383678390,1773383678390);
INSERT INTO InvoiceLine VALUES('cmmoiurp20044rqbeck2olkj3','cmmoiurp20040rqbetciuf4dq',3,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',3.0,'ชุด',957,0,2871,7.0,201,NULL,1773383678390,1773383678390);
INSERT INTO InvoiceLine VALUES('cmmoiurp20045rqbep6l95egd','cmmoiurp20040rqbetciuf4dq',4,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',10.0,'ครั้ง',2974,0,29740,7.0,2082,NULL,1773383678390,1773383678390);
INSERT INTO InvoiceLine VALUES('cmmoiurp20046rqbetujezmlb','cmmoiurp20040rqbetciuf4dq',5,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',2.0,'ครั้ง',5267,0,10534,7.0,737,NULL,1773383678390,1773383678390);
INSERT INTO InvoiceLine VALUES('cmmoiurp3004arqbeqkmrr6q3','cmmoiurp30048rqbe4fi4fqx5',1,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',2.0,'ครั้ง',2547,0,5094,7.0,357,NULL,1773383678391,1773383678391);
INSERT INTO InvoiceLine VALUES('cmmoiurp6004erqbeapbj35m4','cmmoiurp6004crqbedtet8g4q',1,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',10.0,'ครั้ง',779,0,7790,7.0,545,NULL,1773383678394,1773383678394);
INSERT INTO InvoiceLine VALUES('cmmoiurp6004frqbesgl5i505','cmmoiurp6004crqbedtet8g4q',2,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',7.0,'ครั้ง',2004,0,14028,7.0,982,NULL,1773383678394,1773383678394);
INSERT INTO InvoiceLine VALUES('cmmoiurp6004grqbe1q9lsq5b','cmmoiurp6004crqbedtet8g4q',3,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',6.0,'ครั้ง',4951,0,29706,7.0,2079,NULL,1773383678394,1773383678394);
INSERT INTO InvoiceLine VALUES('cmmoiurp7004krqbeb3sxp5f7','cmmoiurp7004irqbevway8cnc',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',4.0,'ชิ้น',1852,0,7408,7.0,519,NULL,1773383678396,1773383678396);
INSERT INTO InvoiceLine VALUES('cmmoiurp7004lrqbeip7gn694','cmmoiurp7004irqbevway8cnc',2,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',5.0,'ครั้ง',779,0,3895,7.0,273,NULL,1773383678396,1773383678396);
INSERT INTO InvoiceLine VALUES('cmmoiurp7004mrqbevnh57z84','cmmoiurp7004irqbevway8cnc',3,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',6.0,'ชิ้น',3455,0,20730,7.0,1451,NULL,1773383678396,1773383678396);
INSERT INTO InvoiceLine VALUES('cmmoiurp7004nrqbe789ulrkm','cmmoiurp7004irqbevway8cnc',4,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',3.0,'ชิ้น',3571,0,10713,7.0,750,NULL,1773383678396,1773383678396);
INSERT INTO InvoiceLine VALUES('cmmoiurp7004orqbedx2f77tz','cmmoiurp7004irqbevway8cnc',5,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',9.0,'ชุด',1005,0,9045,7.0,633,NULL,1773383678396,1773383678396);
INSERT INTO InvoiceLine VALUES('cmmoiurp9004srqbeuvv29iox','cmmoiurp9004qrqbe5m5e5657',1,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',7.0,'ครั้ง',893,0,6251,7.0,438,NULL,1773383678397,1773383678397);
INSERT INTO InvoiceLine VALUES('cmmoiurp9004trqbeooc95pl9','cmmoiurp9004qrqbe5m5e5657',2,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',9.0,'ชุด',1262,0,11358,7.0,795,NULL,1773383678397,1773383678397);
INSERT INTO InvoiceLine VALUES('cmmoiurpd005arqbe3kjeo8kj','cmmoiurpd0058rqbezu0vynpq',1,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',8.0,'ชุด',4289,0,34312,7.0,2402,NULL,1773383678401,1773383678401);
INSERT INTO InvoiceLine VALUES('cmmoiurpd005brqbeck00420i','cmmoiurpd0058rqbezu0vynpq',2,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',9.0,'ครั้ง',4088,0,36792,7.0,2575,NULL,1773383678401,1773383678401);
INSERT INTO InvoiceLine VALUES('cmmoiurpd005crqbevxaysjhq','cmmoiurpd0058rqbezu0vynpq',3,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',4.0,'ชิ้น',5376,0,21504,7.0,1505,NULL,1773383678401,1773383678401);
INSERT INTO InvoiceLine VALUES('cmmoiurpd005drqbe1ny8kxau','cmmoiurpd0058rqbezu0vynpq',4,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',9.0,'ครั้ง',3047,0,27423,7.0,1920,NULL,1773383678401,1773383678401);
INSERT INTO InvoiceLine VALUES('cmmoiurpd005erqbe8ry0d17e','cmmoiurpd0058rqbezu0vynpq',5,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',8.0,'ครั้ง',3325,0,26600,7.0,1862,NULL,1773383678401,1773383678401);
INSERT INTO InvoiceLine VALUES('cmmoiurpe005irqbem0p5ia5r','cmmoiurpe005grqbe31i4q2ct',1,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',5.0,'ครั้ง',4262,0,21310,7.0,1492,NULL,1773383678403,1773383678403);
INSERT INTO InvoiceLine VALUES('cmmoiurpe005jrqbe99nds3lb','cmmoiurpe005grqbe31i4q2ct',2,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',4.0,'ชิ้น',5293,0,21172,7.0,1482,NULL,1773383678403,1773383678403);
INSERT INTO InvoiceLine VALUES('cmmoiurpe005krqbe3zuykmkt','cmmoiurpe005grqbe31i4q2ct',3,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',4.0,'ชิ้น',3310,0,13240,7.0,927,NULL,1773383678403,1773383678403);
INSERT INTO InvoiceLine VALUES('cmmoiurpe005lrqbeksxaugm4','cmmoiurpe005grqbe31i4q2ct',4,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',8.0,'ชิ้น',2861,0,22888,7.0,1602,NULL,1773383678403,1773383678403);
INSERT INTO InvoiceLine VALUES('cmmoiurpe005mrqbetwh25go0','cmmoiurpe005grqbe31i4q2ct',5,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',3.0,'ครั้ง',5000,0,15000,7.0,1050,NULL,1773383678403,1773383678403);
INSERT INTO InvoiceLine VALUES('cmmoiurpg005qrqbeqz3c5lks','cmmoiurpg005orqbecd1d5rfr',1,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',2.0,'ครั้ง',936,0,1872,7.0,131,NULL,1773383678404,1773383678404);
INSERT INTO InvoiceLine VALUES('cmmoiurpg005rrqbe54u6o5wg','cmmoiurpg005orqbecd1d5rfr',2,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',2.0,'ครั้ง',2925,0,5850,7.0,410,NULL,1773383678404,1773383678404);
INSERT INTO InvoiceLine VALUES('cmmoiurpg005srqbej87c88px','cmmoiurpg005orqbecd1d5rfr',3,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',4.0,'ครั้ง',4487,0,17948,7.0,1256,NULL,1773383678404,1773383678404);
INSERT INTO InvoiceLine VALUES('cmmoiurpg005trqbeno9iscgz','cmmoiurpg005orqbecd1d5rfr',4,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',8.0,'ครั้ง',2889,0,23112,7.0,1618,NULL,1773383678404,1773383678404);
INSERT INTO InvoiceLine VALUES('cmmoiurpj0061rqbetatgmnmf','cmmoiurpj005zrqbephmu8n4x',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',8.0,'ชิ้น',1815,0,14520,7.0,1016,NULL,1773383678407,1773383678407);
INSERT INTO InvoiceLine VALUES('cmmoiurpj0062rqbe4yhn42e4','cmmoiurpj005zrqbephmu8n4x',2,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',1.0,'ชุด',4282,0,4282,7.0,300,NULL,1773383678407,1773383678407);
INSERT INTO InvoiceLine VALUES('cmmoiurpj0063rqbett0q3ec0','cmmoiurpj005zrqbephmu8n4x',3,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',4.0,'ชุด',4409,0,17636,7.0,1235,NULL,1773383678407,1773383678407);
INSERT INTO InvoiceLine VALUES('cmmoiurpj0064rqbec0suu348','cmmoiurpj005zrqbephmu8n4x',4,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',10.0,'ครั้ง',4427,0,44270,7.0,3099,NULL,1773383678407,1773383678407);
INSERT INTO InvoiceLine VALUES('cmmoiurpk0068rqbeyk4zxpau','cmmoiurpk0066rqbeppy3wm30',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',8.0,'ชิ้น',3598,0,28784,7.0,2015,NULL,1773383678408,1773383678408);
INSERT INTO InvoiceLine VALUES('cmmoiurpk0069rqbev63jfvio','cmmoiurpk0066rqbeppy3wm30',2,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',5.0,'ครั้ง',4805,0,24025,7.0,1682,NULL,1773383678408,1773383678408);
INSERT INTO InvoiceLine VALUES('cmmoiurpk006arqbexdfxchxc','cmmoiurpk0066rqbeppy3wm30',3,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',7.0,'ครั้ง',3915,0,27405,7.0,1918,NULL,1773383678408,1773383678408);
INSERT INTO InvoiceLine VALUES('cmmoiurpl006erqbezhbyij9a','cmmoiurpl006crqbeyoaqpbnh',1,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',3.0,'ชุด',3777,0,11331,7.0,793,NULL,1773383678410,1773383678410);
INSERT INTO InvoiceLine VALUES('cmmoiurpn006irqbehxiogenu','cmmoiurpn006grqbe9i61it1x',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',2.0,'ชิ้น',1509,0,3018,7.0,211,NULL,1773383678411,1773383678411);
INSERT INTO InvoiceLine VALUES('cmmoiurpn006jrqbevlxpqzh3','cmmoiurpn006grqbe9i61it1x',2,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',5.0,'ครั้ง',1513,0,7565,7.0,530,NULL,1773383678411,1773383678411);
INSERT INTO InvoiceLine VALUES('cmmoiurpn006krqbeyzg1a0l7','cmmoiurpn006grqbe9i61it1x',3,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',5.0,'ชุด',1337,0,6685,7.0,468,NULL,1773383678411,1773383678411);
INSERT INTO InvoiceLine VALUES('cmmoiurpn006lrqbelbc25i66','cmmoiurpn006grqbe9i61it1x',4,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',6.0,'ครั้ง',1794,0,10764,7.0,753,NULL,1773383678411,1773383678411);
INSERT INTO InvoiceLine VALUES('cmmoiurpn006mrqbegzwcb40c','cmmoiurpn006grqbe9i61it1x',5,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',5.0,'ชุด',4979,0,24895,7.0,1743,NULL,1773383678411,1773383678411);
INSERT INTO InvoiceLine VALUES('cmmoiurpo006qrqbeg55vmkjv','cmmoiurpo006orqbe0d0va89u',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',4.0,'ชิ้น',2275,0,9100,7.0,637,NULL,1773383678412,1773383678412);
INSERT INTO InvoiceLine VALUES('cmmoiurpr0071rqbeop7e2u63','cmmoiurpr006zrqbebhl5nikz',1,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',10.0,'ชุด',4616,0,46160,7.0,3231,NULL,1773383678416,1773383678416);
INSERT INTO InvoiceLine VALUES('cmmoiurpu0079rqbe0570pmlc','cmmoiurpu0077rqbeklqwexqw',1,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',10.0,'ครั้ง',2106,0,21060,7.0,1474,NULL,1773383678419,1773383678419);
INSERT INTO InvoiceLine VALUES('cmmoiurpw007drqbe84405de6','cmmoiurpw007brqbexhpl8uil',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',5.0,'ชิ้น',2090,0,10450,7.0,732,NULL,1773383678420,1773383678420);
INSERT INTO InvoiceLine VALUES('cmmoiurpx007hrqbev8l2df13','cmmoiurpx007frqbe66prlnzi',1,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',9.0,'ครั้ง',5093,0,45837,7.0,3209,NULL,1773383678421,1773383678421);
INSERT INTO InvoiceLine VALUES('cmmoiurpx007irqbeeua3abs0','cmmoiurpx007frqbe66prlnzi',2,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',6.0,'ชิ้น',3958,0,23748,7.0,1662,NULL,1773383678421,1773383678421);
INSERT INTO InvoiceLine VALUES('cmmoiurq0007rrqbeggnrmerg','cmmoiurq0007prqbehej68nt4',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',6.0,'ชิ้น',1085,0,6510,7.0,456,NULL,1773383678424,1773383678424);
INSERT INTO InvoiceLine VALUES('cmmoiurq0007srqbend7fmbaz','cmmoiurq0007prqbehej68nt4',2,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',4.0,'ชุด',2783,0,11132,7.0,779,NULL,1773383678424,1773383678424);
INSERT INTO InvoiceLine VALUES('cmmoiurq30081rqbeacdofgeo','cmmoiurq3007zrqbev0jpergg',1,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',7.0,'ครั้ง',900,0,6300,7.0,441,NULL,1773383678427,1773383678427);
INSERT INTO InvoiceLine VALUES('cmmoiurq30082rqbetdc7ja7q','cmmoiurq3007zrqbev0jpergg',2,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',4.0,'ชุด',528,0,2112,7.0,148,NULL,1773383678427,1773383678427);
INSERT INTO InvoiceLine VALUES('cmmoiurq30083rqbexaty9u9h','cmmoiurq3007zrqbev0jpergg',3,'cmmnqsfo3002k03yp3qbfcti2','สินค้าตัวอย่าง B',1.0,'ชุด',1237,0,1237,7.0,87,NULL,1773383678427,1773383678427);
INSERT INTO InvoiceLine VALUES('cmmoiurq6008crqbe9oqwknmt','cmmoiurq6008arqbe3vxl4f9w',1,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',3.0,'ครั้ง',4288,0,12864,7.0,900,NULL,1773383678430,1773383678430);
INSERT INTO InvoiceLine VALUES('cmmoiurq6008drqbeow6b4q99','cmmoiurq6008arqbe3vxl4f9w',2,'cmmnqsfo3002l03yppmp94g7o','ค่าบริการให้คำปรึกษา',6.0,'ครั้ง',3112,0,18672,7.0,1307,NULL,1773383678430,1773383678430);
INSERT INTO InvoiceLine VALUES('cmmoiurq6008erqbey0tam9d8','cmmoiurq6008arqbe3vxl4f9w',3,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',7.0,'ครั้ง',4049,0,28343,7.0,1984,NULL,1773383678430,1773383678430);
INSERT INTO InvoiceLine VALUES('cmmoiurq6008frqbevqatts2g','cmmoiurq6008arqbe3vxl4f9w',4,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',2.0,'ครั้ง',3976,0,7952,7.0,557,NULL,1773383678430,1773383678430);
INSERT INTO InvoiceLine VALUES('cmmoiurqc008orqbe69i6bts2','cmmoiurqc008mrqbeszm7cdd7',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',10.0,'ชิ้น',3099,0,30990,7.0,2169,NULL,1773383678436,1773383678436);
INSERT INTO InvoiceLine VALUES('cmmoiurqc008prqbeaa4dggt0','cmmoiurqc008mrqbeszm7cdd7',2,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',7.0,'ชิ้น',1997,0,13979,7.0,979,NULL,1773383678436,1773383678436);
INSERT INTO InvoiceLine VALUES('cmmoiurqc008qrqbespl028qs','cmmoiurqc008mrqbeszm7cdd7',3,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',4.0,'ครั้ง',1118,0,4472,7.0,313,NULL,1773383678436,1773383678436);
INSERT INTO InvoiceLine VALUES('cmmoiurqc008rrqbewkp1cxh7','cmmoiurqc008mrqbeszm7cdd7',4,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',10.0,'ชิ้น',4185,0,41850,7.0,2930,NULL,1773383678436,1773383678436);
INSERT INTO InvoiceLine VALUES('cmmoiurqc008srqbezx2ysay0','cmmoiurqc008mrqbeszm7cdd7',5,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',1.0,'ชิ้น',1441,0,1441,7.0,101,NULL,1773383678436,1773383678436);
INSERT INTO InvoiceLine VALUES('cmmoiurqf0090rqbexv8u1ib0','cmmoiurqf008yrqbet1irrr7k',1,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',8.0,'ชิ้น',4092,0,32736,7.0,2292,NULL,1773383678439,1773383678439);
INSERT INTO InvoiceLine VALUES('cmmoiurqf0091rqbekv3omy83','cmmoiurqf008yrqbet1irrr7k',2,'cmmnqsfo1002j03ypg1mqpq7i','สินค้าตัวอย่าง A',8.0,'ชิ้น',1837,0,14696,7.0,1029,NULL,1773383678439,1773383678439);
INSERT INTO InvoiceLine VALUES('cmmoiurqf0092rqbeks1d3dse','cmmoiurqf008yrqbet1irrr7k',3,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',8.0,'ครั้ง',4763,0,38104,7.0,2667,NULL,1773383678439,1773383678439);
INSERT INTO InvoiceLine VALUES('cmmoiurqf0093rqbep6hbazyw','cmmoiurqf008yrqbet1irrr7k',4,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',2.0,'ครั้ง',2388,0,4776,7.0,334,NULL,1773383678439,1773383678439);
INSERT INTO InvoiceLine VALUES('cmmoiurqg0097rqbemy5hp9jn','cmmoiurqg0095rqbed8ceylpa',1,'cmmnqsfo4002m03yptdzlnzkj','ค่าบริการซ่อมบำรุง',3.0,'ครั้ง',1181,0,3543,7.0,248,NULL,1773383678440,1773383678440);
CREATE TABLE IF NOT EXISTS "JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryNo" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "documentType" TEXT,
    "documentId" TEXT,
    "totalDebit" INTEGER NOT NULL DEFAULT 0,
    "totalCredit" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isAdjustment" BOOLEAN NOT NULL DEFAULT false,
    "isReversing" BOOLEAN NOT NULL DEFAULT false,
    "reversingId" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "idempotencyKey" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO JournalEntry VALUES('cmmnqsfqs00c103yp4muw6n1g','JV-2568-0001',1761389509161,'ลูกหนี้การค้า',NULL,NULL,NULL,11464,11464,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540341,1773336540341);
INSERT INTO JournalEntry VALUES('cmmnqsfqu00c603ypcrdkdnlg','JV-2568-0002',1763080975230,'ลูกหนี้การค้า',NULL,NULL,NULL,25789,25789,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540342,1773336540342);
INSERT INTO JournalEntry VALUES('cmmnqsfqv00cb03yp99tdbv85','JV-2568-0003',1771305621142,'ลูกหนี้การค้า',NULL,NULL,NULL,20188,20188,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540343,1773336540343);
INSERT INTO JournalEntry VALUES('cmmnqsfqw00cg03ypjt4sfh4s','JV-2568-0004',1764422062549,'ลูกหนี้การค้า',NULL,NULL,NULL,29534,29534,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540345,1773336540345);
INSERT INTO JournalEntry VALUES('cmmnqsfqx00cl03ypbgf45iy3','JV-2568-0005',1769323151884,'ลูกหนี้การค้า',NULL,NULL,NULL,15924,15924,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540346,1773336540346);
INSERT INTO JournalEntry VALUES('cmmnqsfqz00cq03yppe1kv4w4','JV-2568-0006',1767837845691,'ลูกหนี้การค้า',NULL,NULL,NULL,24043,24043,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540347,1773336540347);
INSERT INTO JournalEntry VALUES('cmmnqsfr000cv03ypneda632b','JV-2568-0007',1771292896686,'ลูกหนี้การค้า',NULL,NULL,NULL,7365,7365,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540348,1773336540348);
INSERT INTO JournalEntry VALUES('cmmnqsfr100d003yp6fafylt0','JV-2568-0008',1766935074273,'ลูกหนี้การค้า',NULL,NULL,NULL,50532,50532,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540349,1773336540349);
INSERT INTO JournalEntry VALUES('cmmnqsfr200d503yp6yn1lru0','JV-2568-0009',1762501457839,'ลูกหนี้การค้า',NULL,NULL,NULL,25782,25782,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540350,1773336540350);
INSERT INTO JournalEntry VALUES('cmmnqsfr300da03yp5gm4s4wm','JV-2568-0010',1771594931089,'ลูกหนี้การค้า',NULL,NULL,NULL,42744,42744,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540352,1773336540352);
INSERT INTO JournalEntry VALUES('cmmnqsfr400df03ypt7kcmt0j','JV-2568-0011',1763651344400,'ลูกหนี้การค้า',NULL,NULL,NULL,18869,18869,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540353,1773336540353);
INSERT INTO JournalEntry VALUES('cmmnqsfr500dk03ypv0e7sqbz','JV-2568-0012',1765016837040,'ลูกหนี้การค้า',NULL,NULL,NULL,27117,27117,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540354,1773336540354);
INSERT INTO JournalEntry VALUES('cmmnqsfr700dp03yp1cs8g1p4','JV-2568-0013',1770959628789,'ลูกหนี้การค้า',NULL,NULL,NULL,11253,11253,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540355,1773336540355);
INSERT INTO JournalEntry VALUES('cmmnqsfr800du03ypkczl4epv','JV-2568-0014',1772655587895,'ลูกหนี้การค้า',NULL,NULL,NULL,37111,37111,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540356,1773336540356);
INSERT INTO JournalEntry VALUES('cmmnqsfr900dz03yp3s1fyjyd','JV-2568-0015',1760117139498,'ลูกหนี้การค้า',NULL,NULL,NULL,16524,16524,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540357,1773336540357);
INSERT INTO JournalEntry VALUES('cmmnqsfra00e403ypttkmtmof','JV-2568-0016',1770516809695,'ลูกหนี้การค้า',NULL,NULL,NULL,24286,24286,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540358,1773336540358);
INSERT INTO JournalEntry VALUES('cmmnqsfrb00e903ypi62g75m2','JV-2568-0017',1764769076130,'ลูกหนี้การค้า',NULL,NULL,NULL,26143,26143,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540359,1773336540359);
INSERT INTO JournalEntry VALUES('cmmnqsfrc00ee03yphmzihzah','JV-2568-0018',1771574171519,'ลูกหนี้การค้า',NULL,NULL,NULL,14703,14703,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540361,1773336540361);
INSERT INTO JournalEntry VALUES('cmmnqsfrd00ej03ypu7fx1jq5','JV-2568-0019',1767574156578,'ลูกหนี้การค้า',NULL,NULL,NULL,17401,17401,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540362,1773336540362);
INSERT INTO JournalEntry VALUES('cmmnqsfre00eo03yppso33xj8','JV-2568-0020',1763100625274,'ลูกหนี้การค้า',NULL,NULL,NULL,34435,34435,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540363,1773336540363);
INSERT INTO JournalEntry VALUES('cmmnqsfrf00et03ypg74evry0','JV-2568-0021',1759871147994,'ลูกหนี้การค้า',NULL,NULL,NULL,14913,14913,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540364,1773336540364);
INSERT INTO JournalEntry VALUES('cmmnqsfrg00ey03ypdd0e2r70','JV-2568-0022',1761391781363,'ลูกหนี้การค้า',NULL,NULL,NULL,42551,42551,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540365,1773336540365);
INSERT INTO JournalEntry VALUES('cmmnqsfri00f303yp1vzm9g9n','JV-2568-0023',1771258419871,'ลูกหนี้การค้า',NULL,NULL,NULL,45435,45435,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540366,1773336540366);
INSERT INTO JournalEntry VALUES('cmmnqsfrj00f803yp8zhmdkbk','JV-2568-0024',1771076539518,'ลูกหนี้การค้า',NULL,NULL,NULL,10009,10009,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540367,1773336540367);
INSERT INTO JournalEntry VALUES('cmmnqsfrk00fd03ypocp7f845','JV-2568-0025',1767233548164,'ลูกหนี้การค้า',NULL,NULL,NULL,25018,25018,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540368,1773336540368);
INSERT INTO JournalEntry VALUES('cmmnqsfrl00fi03ypcj5nuoib','JV-2568-0026',1764051514009,'ลูกหนี้การค้า',NULL,NULL,NULL,37339,37339,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540369,1773336540369);
INSERT INTO JournalEntry VALUES('cmmnqsfrm00fn03ypzx8o7yhr','JV-2568-0027',1771616044584,'ลูกหนี้การค้า',NULL,NULL,NULL,44889,44889,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540371,1773336540371);
INSERT INTO JournalEntry VALUES('cmmnqsfrn00fs03yp424m75ks','JV-2568-0028',1765990079301,'ลูกหนี้การค้า',NULL,NULL,NULL,10266,10266,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540372,1773336540372);
INSERT INTO JournalEntry VALUES('cmmnqsfro00fx03yps7koz1am','JV-2568-0029',1772218007652,'ลูกหนี้การค้า',NULL,NULL,NULL,11309,11309,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540373,1773336540373);
INSERT INTO JournalEntry VALUES('cmmnqsfrp00g203ypw1ica78f','JV-2568-0030',1763818794920,'ลูกหนี้การค้า',NULL,NULL,NULL,25766,25766,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540374,1773336540374);
INSERT INTO JournalEntry VALUES('cmmnqsfrr00g703yp3lh730ns','JV-2568-0031',1764259485005,'ลูกหนี้การค้า',NULL,NULL,NULL,33298,33298,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540375,1773336540375);
INSERT INTO JournalEntry VALUES('cmmnqsfrs00gc03yp25afqn0m','JV-2568-0032',1769827600922,'ลูกหนี้การค้า',NULL,NULL,NULL,57584,57584,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540376,1773336540376);
INSERT INTO JournalEntry VALUES('cmmnqsfrt00gh03yps7ang6lp','JV-2568-0033',1763462923227,'ลูกหนี้การค้า',NULL,NULL,NULL,58643,58643,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540377,1773336540377);
INSERT INTO JournalEntry VALUES('cmmnqsfru00gm03ypnlzmbpoo','JV-2568-0034',1768174177530,'ลูกหนี้การค้า',NULL,NULL,NULL,26416,26416,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540379,1773336540379);
INSERT INTO JournalEntry VALUES('cmmnqsfrv00gr03yp9q3ljcls','JV-2568-0035',1765327498582,'ลูกหนี้การค้า',NULL,NULL,NULL,56570,56570,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540380,1773336540380);
INSERT INTO JournalEntry VALUES('cmmnqsfrw00gw03yp0xkzubnw','JV-2568-0036',1764266789669,'ลูกหนี้การค้า',NULL,NULL,NULL,49168,49168,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540381,1773336540381);
INSERT INTO JournalEntry VALUES('cmmnqsfry00h103yp6kt2adhb','JV-2568-0037',1759663759940,'ลูกหนี้การค้า',NULL,NULL,NULL,50790,50790,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540382,1773336540382);
INSERT INTO JournalEntry VALUES('cmmnqsfrz00h603ypcf07p7ne','JV-2568-0038',1764093793161,'ลูกหนี้การค้า',NULL,NULL,NULL,15406,15406,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540383,1773336540383);
INSERT INTO JournalEntry VALUES('cmmnqsfs000hb03yplfiivxju','JV-2568-0039',1765469405695,'ลูกหนี้การค้า',NULL,NULL,NULL,26315,26315,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540385,1773336540385);
INSERT INTO JournalEntry VALUES('cmmnqsfs100hg03ypjewcr0ev','JV-2568-0040',1759404262014,'ลูกหนี้การค้า',NULL,NULL,NULL,11348,11348,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540386,1773336540386);
INSERT INTO JournalEntry VALUES('cmmnqsfs300hl03ypsj2g2eeo','JV-2568-0041',1767262336314,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,6044,6044,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540387,1773336540387);
INSERT INTO JournalEntry VALUES('cmmnqsfs400hq03yp7nr3djjo','JV-2568-0042',1762387562095,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,34833,34833,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540388,1773336540388);
INSERT INTO JournalEntry VALUES('cmmnqsfs500hv03yp2ygy6frf','JV-2568-0043',1764934521814,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,4187,4187,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540389,1773336540389);
INSERT INTO JournalEntry VALUES('cmmnqsfs600i003ypvvtio0tl','JV-2568-0044',1768994629936,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,11674,11674,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540391,1773336540391);
INSERT INTO JournalEntry VALUES('cmmnqsfs700i503ypfjsf1uyd','JV-2568-0045',1771235787577,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,30068,30068,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540392,1773336540392);
INSERT INTO JournalEntry VALUES('cmmnqsfs900ia03ypl5ymti3j','JV-2568-0046',1769974445927,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,35079,35079,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540393,1773336540393);
INSERT INTO JournalEntry VALUES('cmmnqsfsa00if03yp390sslcu','JV-2568-0047',1765126302946,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,7425,7425,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540394,1773336540394);
INSERT INTO JournalEntry VALUES('cmmnqsfsb00ik03ypzkrbcmqw','JV-2568-0048',1761553102341,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,31991,31991,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540395,1773336540395);
INSERT INTO JournalEntry VALUES('cmmnqsfsc00ip03ypfllcmhyq','JV-2568-0049',1761440818142,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,27275,27275,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540396,1773336540396);
INSERT INTO JournalEntry VALUES('cmmnqsfsd00iu03ypo55z2797','JV-2568-0050',1768290200333,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,27481,27481,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540397,1773336540397);
INSERT INTO JournalEntry VALUES('cmmnqsfse00iz03ypnh2rjyrc','JV-2568-0051',1759584833494,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,21994,21994,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540399,1773336540399);
INSERT INTO JournalEntry VALUES('cmmnqsfsf00j403yp55m2wngk','JV-2568-0052',1766550953092,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,32155,32155,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540400,1773336540400);
INSERT INTO JournalEntry VALUES('cmmnqsfsg00j903ypcnltjvhk','JV-2568-0053',1763501078236,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,4583,4583,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540401,1773336540401);
INSERT INTO JournalEntry VALUES('cmmnqsfsi00je03ypt9r659aw','JV-2568-0054',1760188465418,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,14533,14533,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540402,1773336540402);
INSERT INTO JournalEntry VALUES('cmmnqsfsj00jj03ypquiwxam9','JV-2568-0055',1767912276967,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,9851,9851,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540403,1773336540403);
INSERT INTO JournalEntry VALUES('cmmnqsfsk00jo03yp44a4wz5r','JV-2568-0056',1773978970464,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,29028,29028,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540404,1773336540404);
INSERT INTO JournalEntry VALUES('cmmnqsfsl00jt03yppsz92p10','JV-2568-0057',1765256513397,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,34037,34037,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540405,1773336540405);
INSERT INTO JournalEntry VALUES('cmmnqsfsm00jy03ypmucmsaki','JV-2568-0058',1763907363882,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,17713,17713,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540407,1773336540407);
INSERT INTO JournalEntry VALUES('cmmnqsfsn00k303ypoj9n6ham','JV-2568-0059',1765214765525,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,34366,34366,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540408,1773336540408);
INSERT INTO JournalEntry VALUES('cmmnqsfsp00k803ypifzdt094','JV-2568-0060',1761803847312,'ต้นทุนสินค้าขาย',NULL,NULL,NULL,5086,5086,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540409,1773336540409);
INSERT INTO JournalEntry VALUES('cmmnqsfsq00kd03yp1k91h15z','JV-2568-0061',1766717335739,'เงินสดธนาคาร',NULL,NULL,NULL,13610,13610,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540410,1773336540410);
INSERT INTO JournalEntry VALUES('cmmnqsfsr00kh03ypo1riy50f','JV-2568-0062',1765832759168,'เงินสดธนาคาร',NULL,NULL,NULL,4931,4931,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540412,1773336540412);
INSERT INTO JournalEntry VALUES('cmmnqsfss00kl03ypnaz19sa1','JV-2568-0063',1774224500548,'เงินสดธนาคาร',NULL,NULL,NULL,40871,40871,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540413,1773336540413);
INSERT INTO JournalEntry VALUES('cmmnqsfsu00kp03ypqfulca8h','JV-2568-0064',1766891085618,'เงินสดธนาคาร',NULL,NULL,NULL,37701,37701,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540414,1773336540414);
INSERT INTO JournalEntry VALUES('cmmnqsfsv00kt03yp35px1oio','JV-2568-0065',1768681361833,'เงินสดธนาคาร',NULL,NULL,NULL,31102,31102,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540415,1773336540415);
INSERT INTO JournalEntry VALUES('cmmnqsfsw00kx03ypxk8cldgj','JV-2568-0066',1771400202038,'เงินสดธนาคาร',NULL,NULL,NULL,43026,43026,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540416,1773336540416);
INSERT INTO JournalEntry VALUES('cmmnqsfsx00l103yp0i4upmpn','JV-2568-0067',1760788685575,'เงินสดธนาคาร',NULL,NULL,NULL,18571,18571,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540418,1773336540418);
INSERT INTO JournalEntry VALUES('cmmnqsfsy00l503yp9e6g00z6','JV-2568-0068',1766551358569,'เงินสดธนาคาร',NULL,NULL,NULL,4513,4513,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540419,1773336540419);
INSERT INTO JournalEntry VALUES('cmmnqsfsz00l903ypehekjeub','JV-2568-0069',1762329237117,'เงินสดธนาคาร',NULL,NULL,NULL,11472,11472,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540420,1773336540420);
INSERT INTO JournalEntry VALUES('cmmnqsft100ld03yp3fa83tkl','JV-2568-0070',1764907413636,'เงินสดธนาคาร',NULL,NULL,NULL,11838,11838,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540421,1773336540421);
INSERT INTO JournalEntry VALUES('cmmnqsft200lh03ypof5cw4ld','JV-2568-0071',1772443054710,'เงินสดธนาคาร',NULL,NULL,NULL,37963,37963,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540422,1773336540422);
INSERT INTO JournalEntry VALUES('cmmnqsft300ll03ypd054g39k','JV-2568-0072',1759976102929,'เงินสดธนาคาร',NULL,NULL,NULL,5019,5019,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540423,1773336540423);
INSERT INTO JournalEntry VALUES('cmmnqsft400lp03ypo7vxsz7l','JV-2568-0073',1761337867087,'เงินสดธนาคาร',NULL,NULL,NULL,38638,38638,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540424,1773336540424);
INSERT INTO JournalEntry VALUES('cmmnqsft500lt03ypw6grxu4k','JV-2568-0074',1763460107420,'เงินสดธนาคาร',NULL,NULL,NULL,8947,8947,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540425,1773336540425);
INSERT INTO JournalEntry VALUES('cmmnqsft600lx03ypbhetvsch','JV-2568-0075',1768097495855,'เงินสดธนาคาร',NULL,NULL,NULL,22031,22031,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540426,1773336540426);
INSERT INTO JournalEntry VALUES('cmmnqsft700m103yptdi34mtd','JV-2568-0076',1762264856350,'เจ้าหนี้การค้า',NULL,NULL,NULL,22604,22604,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540427,1773336540427);
INSERT INTO JournalEntry VALUES('cmmnqsft800m503yp5481fsp8','JV-2568-0077',1773569416938,'เจ้าหนี้การค้า',NULL,NULL,NULL,4638,4638,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540428,1773336540428);
INSERT INTO JournalEntry VALUES('cmmnqsft900m903yp85dx0fa7','JV-2568-0078',1761359641173,'เจ้าหนี้การค้า',NULL,NULL,NULL,11654,11654,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540429,1773336540429);
INSERT INTO JournalEntry VALUES('cmmnqsfta00md03ypyfta7d73','JV-2568-0079',1766226912146,'เจ้าหนี้การค้า',NULL,NULL,NULL,15708,15708,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540431,1773336540431);
INSERT INTO JournalEntry VALUES('cmmnqsftb00mh03ypeve9k4mr','JV-2568-0080',1762190069322,'เจ้าหนี้การค้า',NULL,NULL,NULL,17585,17585,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540432,1773336540432);
INSERT INTO JournalEntry VALUES('cmmnqsftc00ml03ypt7sj7cta','JV-2568-0081',1765062349566,'เจ้าหนี้การค้า',NULL,NULL,NULL,12432,12432,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540433,1773336540433);
INSERT INTO JournalEntry VALUES('cmmnqsftd00mp03yp352wtcn2','JV-2568-0082',1771089840046,'เจ้าหนี้การค้า',NULL,NULL,NULL,9084,9084,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540434,1773336540434);
INSERT INTO JournalEntry VALUES('cmmnqsftf00mt03ypf6rgxqls','JV-2568-0083',1761981347952,'เจ้าหนี้การค้า',NULL,NULL,NULL,14716,14716,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540435,1773336540435);
INSERT INTO JournalEntry VALUES('cmmnqsftg00mx03ypfse9ieok','JV-2568-0084',1761771968374,'เจ้าหนี้การค้า',NULL,NULL,NULL,25540,25540,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540436,1773336540436);
INSERT INTO JournalEntry VALUES('cmmnqsfth00n103yp8njrh6di','JV-2568-0085',1759443952909,'เจ้าหนี้การค้า',NULL,NULL,NULL,18133,18133,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540437,1773336540437);
INSERT INTO JournalEntry VALUES('cmmnqsfti00n503ypird2kna7','JV-2568-0086',1766681203684,'เงินเดือนและค่าจ้าง',NULL,NULL,NULL,59070,59070,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540439,1773336540439);
INSERT INTO JournalEntry VALUES('cmmnqsftj00n903ypf3gycdml','JV-2568-0087',1760750574039,'เงินเดือนและค่าจ้าง',NULL,NULL,NULL,60439,60439,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540440,1773336540440);
INSERT INTO JournalEntry VALUES('cmmnqsftk00nd03ypzxi5v3d8','JV-2568-0088',1764773236123,'ค่าเสื่อมราคา',NULL,NULL,NULL,4013,4013,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540441,1773336540441);
INSERT INTO JournalEntry VALUES('cmmnqsftl00nh03ypvc079qv0','JV-2568-0089',1761607018614,'ค่าน้ำประปา',NULL,NULL,NULL,4279,4279,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540442,1773336540442);
INSERT INTO JournalEntry VALUES('cmmnqsftn00nm03ypjyw7g203','JV-2568-0090',1771654824999,'เงินเดือนและค่าจ้าง',NULL,NULL,NULL,108203,108203,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540444,1773336540444);
INSERT INTO JournalEntry VALUES('cmmnqsftp00nq03ypzjaj5iv6','JV-2568-0091',1772631033485,'ค่าธรรมเนียมธนาคาร',NULL,NULL,NULL,335,335,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540445,1773336540445);
INSERT INTO JournalEntry VALUES('cmmnqsftq00nu03ypyzl9oxn5','JV-2568-0092',1765092360742,'เงินเดือนและค่าจ้าง',NULL,NULL,NULL,109492,109492,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540446,1773336540446);
INSERT INTO JournalEntry VALUES('cmmnqsftr00ny03ypv1x74iua','JV-2568-0093',1772197180672,'ค่าเช่าอาคาร',NULL,NULL,NULL,22230,22230,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540447,1773336540447);
INSERT INTO JournalEntry VALUES('cmmnqsfts00o203yp0qqcdnjz','JV-2568-0094',1772737730302,'ค่าธรรมเนียมธนาคาร',NULL,NULL,NULL,101,101,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540449,1773336540449);
INSERT INTO JournalEntry VALUES('cmmnqsftt00o603ypgkwq91f4','JV-2568-0095',1762039146570,'ค่าเช่าอาคาร',NULL,NULL,NULL,44457,44457,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540450,1773336540450);
INSERT INTO JournalEntry VALUES('cmmnqsftv00oa03ypqcb87bgk','JV-2568-0096',1759906335336,'ดอกเบี้ยรับมัดจำ',NULL,NULL,NULL,1528,1528,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540451,1773336540451);
INSERT INTO JournalEntry VALUES('cmmnqsftw00oe03ypzhky1mfi','JV-2568-0097',1764686710141,'ดอกเบี้ยรับมัดจำ',NULL,NULL,NULL,1683,1683,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540452,1773336540452);
INSERT INTO JournalEntry VALUES('cmmnqsftx00oi03yptv44zjs0','JV-2568-0098',1764504225168,'ค่าใช้จ่ายจ่ายล่วงหน้า',NULL,NULL,NULL,5165,5165,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540454,1773336540454);
INSERT INTO JournalEntry VALUES('cmmnqsfty00om03yp3r3u0swr','JV-2568-0099',1768289054143,'ค่าใช้จ่ายจ่ายล่วงหน้า',NULL,NULL,NULL,8587,8587,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540455,1773336540455);
INSERT INTO JournalEntry VALUES('cmmnqsftz00oq03ypxxth34fy','JV-2568-0100',1771981489914,'ดอกเบี้ยจ่าย',NULL,NULL,NULL,1006,1006,'POSTED',0,0,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,1773336540456,1773336540456);
CREATE TABLE IF NOT EXISTS "JournalLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "accountId" TEXT NOT NULL,
    "description" TEXT,
    "debit" INTEGER NOT NULL DEFAULT 0,
    "credit" INTEGER NOT NULL DEFAULT 0,
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JournalLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartOfAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO JournalLine VALUES('cmmnqsfqs00c303ypqv2p2veb','cmmnqsfqs00c103yp4muw6n1g',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',11464,0,NULL,1773336540341,1773336540341);
INSERT INTO JournalLine VALUES('cmmnqsfqs00c403yp9svl824t','cmmnqsfqs00c103yp4muw6n1g',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,10714,NULL,1773336540341,1773336540341);
INSERT INTO JournalLine VALUES('cmmnqsfqs00c503ypwqa8lwvs','cmmnqsfqs00c103yp4muw6n1g',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,750,NULL,1773336540341,1773336540341);
INSERT INTO JournalLine VALUES('cmmnqsfqu00c803yp8pnwva1s','cmmnqsfqu00c603ypcrdkdnlg',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',25789,0,NULL,1773336540342,1773336540342);
INSERT INTO JournalLine VALUES('cmmnqsfqu00c903ypk9mwowdy','cmmnqsfqu00c603ypcrdkdnlg',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,24102,NULL,1773336540342,1773336540342);
INSERT INTO JournalLine VALUES('cmmnqsfqu00ca03yp4ujww2fd','cmmnqsfqu00c603ypcrdkdnlg',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,1687,NULL,1773336540342,1773336540342);
INSERT INTO JournalLine VALUES('cmmnqsfqv00cd03ypni39ur3j','cmmnqsfqv00cb03yp99tdbv85',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',20188,0,NULL,1773336540343,1773336540343);
INSERT INTO JournalLine VALUES('cmmnqsfqv00ce03yp90tabu40','cmmnqsfqv00cb03yp99tdbv85',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,18867,NULL,1773336540343,1773336540343);
INSERT INTO JournalLine VALUES('cmmnqsfqv00cf03ypsr1da4k1','cmmnqsfqv00cb03yp99tdbv85',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,1321,NULL,1773336540343,1773336540343);
INSERT INTO JournalLine VALUES('cmmnqsfqw00ci03ypxj7ejn6m','cmmnqsfqw00cg03ypjt4sfh4s',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',29534,0,NULL,1773336540345,1773336540345);
INSERT INTO JournalLine VALUES('cmmnqsfqw00cj03ypla4t644c','cmmnqsfqw00cg03ypjt4sfh4s',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,27602,NULL,1773336540345,1773336540345);
INSERT INTO JournalLine VALUES('cmmnqsfqw00ck03yptb5r68h0','cmmnqsfqw00cg03ypjt4sfh4s',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,1932,NULL,1773336540345,1773336540345);
INSERT INTO JournalLine VALUES('cmmnqsfqx00cn03ypzj6rx3qr','cmmnqsfqx00cl03ypbgf45iy3',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',15924,0,NULL,1773336540346,1773336540346);
INSERT INTO JournalLine VALUES('cmmnqsfqx00co03ypqjz8rsv7','cmmnqsfqx00cl03ypbgf45iy3',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,14882,NULL,1773336540346,1773336540346);
INSERT INTO JournalLine VALUES('cmmnqsfqx00cp03ypp176l3nz','cmmnqsfqx00cl03ypbgf45iy3',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,1042,NULL,1773336540346,1773336540346);
INSERT INTO JournalLine VALUES('cmmnqsfqz00cs03ypwnsu3zh4','cmmnqsfqz00cq03yppe1kv4w4',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',24043,0,NULL,1773336540347,1773336540347);
INSERT INTO JournalLine VALUES('cmmnqsfqz00ct03ypac9888nv','cmmnqsfqz00cq03yppe1kv4w4',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,22470,NULL,1773336540347,1773336540347);
INSERT INTO JournalLine VALUES('cmmnqsfqz00cu03ypcc563yi9','cmmnqsfqz00cq03yppe1kv4w4',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,1573,NULL,1773336540347,1773336540347);
INSERT INTO JournalLine VALUES('cmmnqsfr000cx03ypbroenzxc','cmmnqsfr000cv03ypneda632b',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',7365,0,NULL,1773336540348,1773336540348);
INSERT INTO JournalLine VALUES('cmmnqsfr000cy03yp9eiz5vud','cmmnqsfr000cv03ypneda632b',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,6883,NULL,1773336540348,1773336540348);
INSERT INTO JournalLine VALUES('cmmnqsfr000cz03ypp17o6qh3','cmmnqsfr000cv03ypneda632b',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,482,NULL,1773336540348,1773336540348);
INSERT INTO JournalLine VALUES('cmmnqsfr100d203ypo0i4ws74','cmmnqsfr100d003yp6fafylt0',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',50532,0,NULL,1773336540349,1773336540349);
INSERT INTO JournalLine VALUES('cmmnqsfr100d303yphj3o99bq','cmmnqsfr100d003yp6fafylt0',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,47226,NULL,1773336540349,1773336540349);
INSERT INTO JournalLine VALUES('cmmnqsfr100d403yptwksa2lw','cmmnqsfr100d003yp6fafylt0',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,3306,NULL,1773336540349,1773336540349);
INSERT INTO JournalLine VALUES('cmmnqsfr200d703yphh6ibyol','cmmnqsfr200d503yp6yn1lru0',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',25782,0,NULL,1773336540350,1773336540350);
INSERT INTO JournalLine VALUES('cmmnqsfr200d803yp5z712a5f','cmmnqsfr200d503yp6yn1lru0',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,24095,NULL,1773336540350,1773336540350);
INSERT INTO JournalLine VALUES('cmmnqsfr200d903yprts5aq3m','cmmnqsfr200d503yp6yn1lru0',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,1687,NULL,1773336540350,1773336540350);
INSERT INTO JournalLine VALUES('cmmnqsfr300dc03yp0d350pju','cmmnqsfr300da03yp5gm4s4wm',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',42744,0,NULL,1773336540352,1773336540352);
INSERT INTO JournalLine VALUES('cmmnqsfr300dd03yppjfuqlau','cmmnqsfr300da03yp5gm4s4wm',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,39948,NULL,1773336540352,1773336540352);
INSERT INTO JournalLine VALUES('cmmnqsfr300de03yp1s43j6zy','cmmnqsfr300da03yp5gm4s4wm',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,2796,NULL,1773336540352,1773336540352);
INSERT INTO JournalLine VALUES('cmmnqsfr400dh03ypq9qplmn4','cmmnqsfr400df03ypt7kcmt0j',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',18869,0,NULL,1773336540353,1773336540353);
INSERT INTO JournalLine VALUES('cmmnqsfr400di03ypug36h4hg','cmmnqsfr400df03ypt7kcmt0j',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,17635,NULL,1773336540353,1773336540353);
INSERT INTO JournalLine VALUES('cmmnqsfr400dj03ypqtnlfjcy','cmmnqsfr400df03ypt7kcmt0j',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,1234,NULL,1773336540353,1773336540353);
INSERT INTO JournalLine VALUES('cmmnqsfr500dm03yp1f0eiiyi','cmmnqsfr500dk03ypv0e7sqbz',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',27117,0,NULL,1773336540354,1773336540354);
INSERT INTO JournalLine VALUES('cmmnqsfr500dn03ypng2dqml3','cmmnqsfr500dk03ypv0e7sqbz',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,25343,NULL,1773336540354,1773336540354);
INSERT INTO JournalLine VALUES('cmmnqsfr500do03yp6plr1pqj','cmmnqsfr500dk03ypv0e7sqbz',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,1774,NULL,1773336540354,1773336540354);
INSERT INTO JournalLine VALUES('cmmnqsfr700dr03ype6e0h00j','cmmnqsfr700dp03yp1cs8g1p4',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',11253,0,NULL,1773336540355,1773336540355);
INSERT INTO JournalLine VALUES('cmmnqsfr700ds03ypxfivppfa','cmmnqsfr700dp03yp1cs8g1p4',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,10517,NULL,1773336540355,1773336540355);
INSERT INTO JournalLine VALUES('cmmnqsfr700dt03yptiup869s','cmmnqsfr700dp03yp1cs8g1p4',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,736,NULL,1773336540355,1773336540355);
INSERT INTO JournalLine VALUES('cmmnqsfr800dw03ypzmi4t4d0','cmmnqsfr800du03ypkczl4epv',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',37111,0,NULL,1773336540356,1773336540356);
INSERT INTO JournalLine VALUES('cmmnqsfr800dx03ypydrs9z5r','cmmnqsfr800du03ypkczl4epv',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,34683,NULL,1773336540356,1773336540356);
INSERT INTO JournalLine VALUES('cmmnqsfr800dy03ypfhdksj7b','cmmnqsfr800du03ypkczl4epv',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,2428,NULL,1773336540356,1773336540356);
INSERT INTO JournalLine VALUES('cmmnqsfr900e103ypfjye5nsp','cmmnqsfr900dz03yp3s1fyjyd',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',16524,0,NULL,1773336540357,1773336540357);
INSERT INTO JournalLine VALUES('cmmnqsfr900e203yp8w2xjfw6','cmmnqsfr900dz03yp3s1fyjyd',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,15443,NULL,1773336540357,1773336540357);
INSERT INTO JournalLine VALUES('cmmnqsfr900e303yp9s5vyax5','cmmnqsfr900dz03yp3s1fyjyd',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,1081,NULL,1773336540357,1773336540357);
INSERT INTO JournalLine VALUES('cmmnqsfra00e603yp2xtjnq8t','cmmnqsfra00e403ypttkmtmof',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',24286,0,NULL,1773336540358,1773336540358);
INSERT INTO JournalLine VALUES('cmmnqsfra00e703yp52si8ug4','cmmnqsfra00e403ypttkmtmof',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,22697,NULL,1773336540358,1773336540358);
INSERT INTO JournalLine VALUES('cmmnqsfra00e803yp8tuvzhvd','cmmnqsfra00e403ypttkmtmof',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,1589,NULL,1773336540358,1773336540358);
INSERT INTO JournalLine VALUES('cmmnqsfrb00eb03ypy0xqww05','cmmnqsfrb00e903ypi62g75m2',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',26143,0,NULL,1773336540359,1773336540359);
INSERT INTO JournalLine VALUES('cmmnqsfrb00ec03ypuspatxu5','cmmnqsfrb00e903ypi62g75m2',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,24433,NULL,1773336540359,1773336540359);
INSERT INTO JournalLine VALUES('cmmnqsfrb00ed03ypkbb6f21x','cmmnqsfrb00e903ypi62g75m2',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,1710,NULL,1773336540359,1773336540359);
INSERT INTO JournalLine VALUES('cmmnqsfrc00eg03ypqpry5ktm','cmmnqsfrc00ee03yphmzihzah',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',14703,0,NULL,1773336540361,1773336540361);
INSERT INTO JournalLine VALUES('cmmnqsfrc00eh03ypo8omzchm','cmmnqsfrc00ee03yphmzihzah',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,13741,NULL,1773336540361,1773336540361);
INSERT INTO JournalLine VALUES('cmmnqsfrc00ei03yp49cq50tk','cmmnqsfrc00ee03yphmzihzah',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,962,NULL,1773336540361,1773336540361);
INSERT INTO JournalLine VALUES('cmmnqsfrd00el03ypwr9iwwyb','cmmnqsfrd00ej03ypu7fx1jq5',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',17401,0,NULL,1773336540362,1773336540362);
INSERT INTO JournalLine VALUES('cmmnqsfrd00em03ypt51sy100','cmmnqsfrd00ej03ypu7fx1jq5',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,16263,NULL,1773336540362,1773336540362);
INSERT INTO JournalLine VALUES('cmmnqsfrd00en03ypboe6me5r','cmmnqsfrd00ej03ypu7fx1jq5',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,1138,NULL,1773336540362,1773336540362);
INSERT INTO JournalLine VALUES('cmmnqsfre00eq03ypd30mvnar','cmmnqsfre00eo03yppso33xj8',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',34435,0,NULL,1773336540363,1773336540363);
INSERT INTO JournalLine VALUES('cmmnqsfre00er03ypay7ubua1','cmmnqsfre00eo03yppso33xj8',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,32182,NULL,1773336540363,1773336540363);
INSERT INTO JournalLine VALUES('cmmnqsfre00es03ypocrfom3d','cmmnqsfre00eo03yppso33xj8',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,2253,NULL,1773336540363,1773336540363);
INSERT INTO JournalLine VALUES('cmmnqsfrf00ev03ypo2j4mhob','cmmnqsfrf00et03ypg74evry0',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',14913,0,NULL,1773336540364,1773336540364);
INSERT INTO JournalLine VALUES('cmmnqsfrf00ew03yp1icjfrg8','cmmnqsfrf00et03ypg74evry0',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,13937,NULL,1773336540364,1773336540364);
INSERT INTO JournalLine VALUES('cmmnqsfrf00ex03ypgqevi48z','cmmnqsfrf00et03ypg74evry0',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,976,NULL,1773336540364,1773336540364);
INSERT INTO JournalLine VALUES('cmmnqsfrg00f003ypdrzae9sj','cmmnqsfrg00ey03ypdd0e2r70',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',42551,0,NULL,1773336540365,1773336540365);
INSERT INTO JournalLine VALUES('cmmnqsfrg00f103yp339ugsvt','cmmnqsfrg00ey03ypdd0e2r70',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,39767,NULL,1773336540365,1773336540365);
INSERT INTO JournalLine VALUES('cmmnqsfrg00f203ypdxfr5t7b','cmmnqsfrg00ey03ypdd0e2r70',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,2784,NULL,1773336540365,1773336540365);
INSERT INTO JournalLine VALUES('cmmnqsfri00f503yp8ri7fj6s','cmmnqsfri00f303yp1vzm9g9n',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',45435,0,NULL,1773336540366,1773336540366);
INSERT INTO JournalLine VALUES('cmmnqsfri00f603ypziofyn5x','cmmnqsfri00f303yp1vzm9g9n',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,42463,NULL,1773336540366,1773336540366);
INSERT INTO JournalLine VALUES('cmmnqsfri00f703ypafehsdzb','cmmnqsfri00f303yp1vzm9g9n',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,2972,NULL,1773336540366,1773336540366);
INSERT INTO JournalLine VALUES('cmmnqsfrj00fa03ypp1xmrykm','cmmnqsfrj00f803yp8zhmdkbk',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',10009,0,NULL,1773336540367,1773336540367);
INSERT INTO JournalLine VALUES('cmmnqsfrj00fb03yphcabqcxo','cmmnqsfrj00f803yp8zhmdkbk',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,9354,NULL,1773336540367,1773336540367);
INSERT INTO JournalLine VALUES('cmmnqsfrj00fc03ypigzbd6j2','cmmnqsfrj00f803yp8zhmdkbk',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,655,NULL,1773336540367,1773336540367);
INSERT INTO JournalLine VALUES('cmmnqsfrk00ff03ypc81d4mrq','cmmnqsfrk00fd03ypocp7f845',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',25018,0,NULL,1773336540368,1773336540368);
INSERT INTO JournalLine VALUES('cmmnqsfrk00fg03ype8s95w75','cmmnqsfrk00fd03ypocp7f845',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,23381,NULL,1773336540368,1773336540368);
INSERT INTO JournalLine VALUES('cmmnqsfrk00fh03yp6v6lfee2','cmmnqsfrk00fd03ypocp7f845',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,1637,NULL,1773336540368,1773336540368);
INSERT INTO JournalLine VALUES('cmmnqsfrl00fk03ypeztwv0jo','cmmnqsfrl00fi03ypcj5nuoib',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',37339,0,NULL,1773336540369,1773336540369);
INSERT INTO JournalLine VALUES('cmmnqsfrl00fl03yp406f8kp8','cmmnqsfrl00fi03ypcj5nuoib',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,34896,NULL,1773336540369,1773336540369);
INSERT INTO JournalLine VALUES('cmmnqsfrl00fm03yp7dzt7y57','cmmnqsfrl00fi03ypcj5nuoib',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,2443,NULL,1773336540369,1773336540369);
INSERT INTO JournalLine VALUES('cmmnqsfrm00fp03ypqullqdks','cmmnqsfrm00fn03ypzx8o7yhr',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',44889,0,NULL,1773336540371,1773336540371);
INSERT INTO JournalLine VALUES('cmmnqsfrm00fq03yp7cn7o30c','cmmnqsfrm00fn03ypzx8o7yhr',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,41952,NULL,1773336540371,1773336540371);
INSERT INTO JournalLine VALUES('cmmnqsfrm00fr03ypua4k521c','cmmnqsfrm00fn03ypzx8o7yhr',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,2937,NULL,1773336540371,1773336540371);
INSERT INTO JournalLine VALUES('cmmnqsfrn00fu03ypffz7s58u','cmmnqsfrn00fs03yp424m75ks',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',10266,0,NULL,1773336540372,1773336540372);
INSERT INTO JournalLine VALUES('cmmnqsfrn00fv03yp3lpy9mlb','cmmnqsfrn00fs03yp424m75ks',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,9594,NULL,1773336540372,1773336540372);
INSERT INTO JournalLine VALUES('cmmnqsfrn00fw03yp8024iuxx','cmmnqsfrn00fs03yp424m75ks',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,672,NULL,1773336540372,1773336540372);
INSERT INTO JournalLine VALUES('cmmnqsfro00fz03yp64dfngwv','cmmnqsfro00fx03yps7koz1am',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',11309,0,NULL,1773336540373,1773336540373);
INSERT INTO JournalLine VALUES('cmmnqsfro00g003ypaqgr111t','cmmnqsfro00fx03yps7koz1am',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,10569,NULL,1773336540373,1773336540373);
INSERT INTO JournalLine VALUES('cmmnqsfro00g103ypiabeusj7','cmmnqsfro00fx03yps7koz1am',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,740,NULL,1773336540373,1773336540373);
INSERT INTO JournalLine VALUES('cmmnqsfrp00g403ypx46rkzl4','cmmnqsfrp00g203ypw1ica78f',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',25766,0,NULL,1773336540374,1773336540374);
INSERT INTO JournalLine VALUES('cmmnqsfrp00g503yp2qrgaiyz','cmmnqsfrp00g203ypw1ica78f',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,24080,NULL,1773336540374,1773336540374);
INSERT INTO JournalLine VALUES('cmmnqsfrp00g603yps4t4gh67','cmmnqsfrp00g203ypw1ica78f',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,1686,NULL,1773336540374,1773336540374);
INSERT INTO JournalLine VALUES('cmmnqsfrr00g903ypw86si5vd','cmmnqsfrr00g703yp3lh730ns',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',33298,0,NULL,1773336540375,1773336540375);
INSERT INTO JournalLine VALUES('cmmnqsfrr00ga03ypislfaybn','cmmnqsfrr00g703yp3lh730ns',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,31120,NULL,1773336540375,1773336540375);
INSERT INTO JournalLine VALUES('cmmnqsfrr00gb03yploq7zi35','cmmnqsfrr00g703yp3lh730ns',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,2178,NULL,1773336540375,1773336540375);
INSERT INTO JournalLine VALUES('cmmnqsfrs00ge03ypdy0mx771','cmmnqsfrs00gc03yp25afqn0m',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',57584,0,NULL,1773336540376,1773336540376);
INSERT INTO JournalLine VALUES('cmmnqsfrs00gf03ypg6sac6xu','cmmnqsfrs00gc03yp25afqn0m',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,53817,NULL,1773336540376,1773336540376);
INSERT INTO JournalLine VALUES('cmmnqsfrs00gg03yp8y6zi1ge','cmmnqsfrs00gc03yp25afqn0m',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,3767,NULL,1773336540376,1773336540376);
INSERT INTO JournalLine VALUES('cmmnqsfrt00gj03ypzlvq57xa','cmmnqsfrt00gh03yps7ang6lp',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',58643,0,NULL,1773336540377,1773336540377);
INSERT INTO JournalLine VALUES('cmmnqsfrt00gk03ypmk4cbgm2','cmmnqsfrt00gh03yps7ang6lp',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,54807,NULL,1773336540377,1773336540377);
INSERT INTO JournalLine VALUES('cmmnqsfrt00gl03ypfwasq2a6','cmmnqsfrt00gh03yps7ang6lp',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,3836,NULL,1773336540377,1773336540377);
INSERT INTO JournalLine VALUES('cmmnqsfru00go03ypv8n4i4pi','cmmnqsfru00gm03ypnlzmbpoo',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',26416,0,NULL,1773336540379,1773336540379);
INSERT INTO JournalLine VALUES('cmmnqsfru00gp03ypt1q4w9tc','cmmnqsfru00gm03ypnlzmbpoo',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,24688,NULL,1773336540379,1773336540379);
INSERT INTO JournalLine VALUES('cmmnqsfru00gq03ypuvlq79lu','cmmnqsfru00gm03ypnlzmbpoo',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,1728,NULL,1773336540379,1773336540379);
INSERT INTO JournalLine VALUES('cmmnqsfrv00gt03ypnbpp02v9','cmmnqsfrv00gr03yp9q3ljcls',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',56570,0,NULL,1773336540380,1773336540380);
INSERT INTO JournalLine VALUES('cmmnqsfrv00gu03ypd7ksbfeg','cmmnqsfrv00gr03yp9q3ljcls',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,52869,NULL,1773336540380,1773336540380);
INSERT INTO JournalLine VALUES('cmmnqsfrv00gv03ypxp9rfuq1','cmmnqsfrv00gr03yp9q3ljcls',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,3701,NULL,1773336540380,1773336540380);
INSERT INTO JournalLine VALUES('cmmnqsfrx00gy03yp8gs4ddlb','cmmnqsfrw00gw03yp0xkzubnw',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',49168,0,NULL,1773336540381,1773336540381);
INSERT INTO JournalLine VALUES('cmmnqsfrx00gz03ypqoqsrcdj','cmmnqsfrw00gw03yp0xkzubnw',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,45951,NULL,1773336540381,1773336540381);
INSERT INTO JournalLine VALUES('cmmnqsfrx00h003yps8ansklk','cmmnqsfrw00gw03yp0xkzubnw',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,3217,NULL,1773336540381,1773336540381);
INSERT INTO JournalLine VALUES('cmmnqsfry00h303ypqjempxrf','cmmnqsfry00h103yp6kt2adhb',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',50790,0,NULL,1773336540382,1773336540382);
INSERT INTO JournalLine VALUES('cmmnqsfry00h403ypqaud4d46','cmmnqsfry00h103yp6kt2adhb',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,47467,NULL,1773336540382,1773336540382);
INSERT INTO JournalLine VALUES('cmmnqsfry00h503ypy6suog9t','cmmnqsfry00h103yp6kt2adhb',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,3323,NULL,1773336540382,1773336540382);
INSERT INTO JournalLine VALUES('cmmnqsfrz00h803ypyh125mct','cmmnqsfrz00h603ypcf07p7ne',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',15406,0,NULL,1773336540383,1773336540383);
INSERT INTO JournalLine VALUES('cmmnqsfrz00h903ypbqg0gomj','cmmnqsfrz00h603ypcf07p7ne',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,14398,NULL,1773336540383,1773336540383);
INSERT INTO JournalLine VALUES('cmmnqsfrz00ha03ypusweo3k3','cmmnqsfrz00h603ypcf07p7ne',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,1008,NULL,1773336540383,1773336540383);
INSERT INTO JournalLine VALUES('cmmnqsfs000hd03ypbtrtjv2r','cmmnqsfs000hb03yplfiivxju',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',26315,0,NULL,1773336540385,1773336540385);
INSERT INTO JournalLine VALUES('cmmnqsfs000he03ypjc2iet9u','cmmnqsfs000hb03yplfiivxju',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,24593,NULL,1773336540385,1773336540385);
INSERT INTO JournalLine VALUES('cmmnqsfs000hf03yptlenneh8','cmmnqsfs000hb03yplfiivxju',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,1722,NULL,1773336540385,1773336540385);
INSERT INTO JournalLine VALUES('cmmnqsfs100hi03ypbvdljdn5','cmmnqsfs100hg03ypjewcr0ev',1,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',11348,0,NULL,1773336540386,1773336540386);
INSERT INTO JournalLine VALUES('cmmnqsfs100hj03ypquvn0dtc','cmmnqsfs100hg03ypjewcr0ev',2,'cmmnqsfm6001b03yp4pev8m1a','รายได้จากการขายสินค้า',0,10606,NULL,1773336540386,1773336540386);
INSERT INTO JournalLine VALUES('cmmnqsfs100hk03ypmolk8pgt','cmmnqsfs100hg03ypjewcr0ev',3,'cmmnqsflw000w03yp6ra94tlx','ภาษีมูลค่าเพิ่มต้องชำระ',0,742,NULL,1773336540386,1773336540386);
INSERT INTO JournalLine VALUES('cmmnqsfs300hn03ypfd1nkwa0','cmmnqsfs300hl03ypsj2g2eeo',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',5649,0,NULL,1773336540387,1773336540387);
INSERT INTO JournalLine VALUES('cmmnqsfs300ho03yp3n32bhbl','cmmnqsfs300hl03ypsj2g2eeo',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',395,0,NULL,1773336540387,1773336540387);
INSERT INTO JournalLine VALUES('cmmnqsfs300hp03ypzde7j26k','cmmnqsfs300hl03ypsj2g2eeo',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,6044,NULL,1773336540387,1773336540387);
INSERT INTO JournalLine VALUES('cmmnqsfs400hs03ypzd5ti8gm','cmmnqsfs400hq03yp7nr3djjo',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',32554,0,NULL,1773336540388,1773336540388);
INSERT INTO JournalLine VALUES('cmmnqsfs400ht03ypxlln46fa','cmmnqsfs400hq03yp7nr3djjo',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',2279,0,NULL,1773336540388,1773336540388);
INSERT INTO JournalLine VALUES('cmmnqsfs400hu03yplaieonx6','cmmnqsfs400hq03yp7nr3djjo',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,34833,NULL,1773336540388,1773336540388);
INSERT INTO JournalLine VALUES('cmmnqsfs500hx03yplflfobjd','cmmnqsfs500hv03yp2ygy6frf',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',3913,0,NULL,1773336540389,1773336540389);
INSERT INTO JournalLine VALUES('cmmnqsfs500hy03yp8co86coi','cmmnqsfs500hv03yp2ygy6frf',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',274,0,NULL,1773336540389,1773336540389);
INSERT INTO JournalLine VALUES('cmmnqsfs500hz03ypl89ch580','cmmnqsfs500hv03yp2ygy6frf',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,4187,NULL,1773336540389,1773336540389);
INSERT INTO JournalLine VALUES('cmmnqsfs600i203yp0oiq3jrc','cmmnqsfs600i003ypvvtio0tl',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',10910,0,NULL,1773336540391,1773336540391);
INSERT INTO JournalLine VALUES('cmmnqsfs600i303ypfj9yz40q','cmmnqsfs600i003ypvvtio0tl',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',764,0,NULL,1773336540391,1773336540391);
INSERT INTO JournalLine VALUES('cmmnqsfs600i403yp5mqjlrlm','cmmnqsfs600i003ypvvtio0tl',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,11674,NULL,1773336540391,1773336540391);
INSERT INTO JournalLine VALUES('cmmnqsfs700i703ypbrmria9o','cmmnqsfs700i503ypfjsf1uyd',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',28101,0,NULL,1773336540392,1773336540392);
INSERT INTO JournalLine VALUES('cmmnqsfs700i803ypxi51ggae','cmmnqsfs700i503ypfjsf1uyd',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',1967,0,NULL,1773336540392,1773336540392);
INSERT INTO JournalLine VALUES('cmmnqsfs700i903ypixa2o5w1','cmmnqsfs700i503ypfjsf1uyd',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,30068,NULL,1773336540392,1773336540392);
INSERT INTO JournalLine VALUES('cmmnqsfs900ic03ypoq2f1dmn','cmmnqsfs900ia03ypl5ymti3j',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',32784,0,NULL,1773336540393,1773336540393);
INSERT INTO JournalLine VALUES('cmmnqsfs900id03ypg9ots05v','cmmnqsfs900ia03ypl5ymti3j',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',2295,0,NULL,1773336540393,1773336540393);
INSERT INTO JournalLine VALUES('cmmnqsfs900ie03ypztwiqao3','cmmnqsfs900ia03ypl5ymti3j',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,35079,NULL,1773336540393,1773336540393);
INSERT INTO JournalLine VALUES('cmmnqsfsa00ih03yphgq74qmr','cmmnqsfsa00if03yp390sslcu',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',6939,0,NULL,1773336540394,1773336540394);
INSERT INTO JournalLine VALUES('cmmnqsfsa00ii03yp970txfaj','cmmnqsfsa00if03yp390sslcu',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',486,0,NULL,1773336540394,1773336540394);
INSERT INTO JournalLine VALUES('cmmnqsfsa00ij03ypzwd8hb9m','cmmnqsfsa00if03yp390sslcu',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,7425,NULL,1773336540394,1773336540394);
INSERT INTO JournalLine VALUES('cmmnqsfsb00im03ypg7xt7pqi','cmmnqsfsb00ik03ypzkrbcmqw',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',29898,0,NULL,1773336540395,1773336540395);
INSERT INTO JournalLine VALUES('cmmnqsfsb00in03ypdohxusnd','cmmnqsfsb00ik03ypzkrbcmqw',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',2093,0,NULL,1773336540395,1773336540395);
INSERT INTO JournalLine VALUES('cmmnqsfsb00io03yplchyq63y','cmmnqsfsb00ik03ypzkrbcmqw',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,31991,NULL,1773336540395,1773336540395);
INSERT INTO JournalLine VALUES('cmmnqsfsc00ir03yp1uy8epnv','cmmnqsfsc00ip03ypfllcmhyq',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',25491,0,NULL,1773336540396,1773336540396);
INSERT INTO JournalLine VALUES('cmmnqsfsc00is03yp01enpxne','cmmnqsfsc00ip03ypfllcmhyq',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',1784,0,NULL,1773336540396,1773336540396);
INSERT INTO JournalLine VALUES('cmmnqsfsc00it03ypweei0jx4','cmmnqsfsc00ip03ypfllcmhyq',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,27275,NULL,1773336540396,1773336540396);
INSERT INTO JournalLine VALUES('cmmnqsfsd00iw03yp1jc51hgr','cmmnqsfsd00iu03ypo55z2797',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',25683,0,NULL,1773336540397,1773336540397);
INSERT INTO JournalLine VALUES('cmmnqsfsd00ix03yp6zgg1ay8','cmmnqsfsd00iu03ypo55z2797',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',1798,0,NULL,1773336540397,1773336540397);
INSERT INTO JournalLine VALUES('cmmnqsfsd00iy03ypzd6bsr67','cmmnqsfsd00iu03ypo55z2797',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,27481,NULL,1773336540397,1773336540397);
INSERT INTO JournalLine VALUES('cmmnqsfse00j103yp9j6la9m6','cmmnqsfse00iz03ypnh2rjyrc',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',20555,0,NULL,1773336540399,1773336540399);
INSERT INTO JournalLine VALUES('cmmnqsfse00j203ypeg7nd5w9','cmmnqsfse00iz03ypnh2rjyrc',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',1439,0,NULL,1773336540399,1773336540399);
INSERT INTO JournalLine VALUES('cmmnqsfse00j303yp0cm1wcwp','cmmnqsfse00iz03ypnh2rjyrc',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,21994,NULL,1773336540399,1773336540399);
INSERT INTO JournalLine VALUES('cmmnqsfsf00j603ypt06wz84t','cmmnqsfsf00j403yp55m2wngk',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',30051,0,NULL,1773336540400,1773336540400);
INSERT INTO JournalLine VALUES('cmmnqsfsf00j703ypvmybn1gg','cmmnqsfsf00j403yp55m2wngk',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',2104,0,NULL,1773336540400,1773336540400);
INSERT INTO JournalLine VALUES('cmmnqsfsf00j803yp8vbvr1xs','cmmnqsfsf00j403yp55m2wngk',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,32155,NULL,1773336540400,1773336540400);
INSERT INTO JournalLine VALUES('cmmnqsfsg00jb03yp0ub49t7e','cmmnqsfsg00j903ypcnltjvhk',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',4283,0,NULL,1773336540401,1773336540401);
INSERT INTO JournalLine VALUES('cmmnqsfsg00jc03ypkcazqsx9','cmmnqsfsg00j903ypcnltjvhk',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',300,0,NULL,1773336540401,1773336540401);
INSERT INTO JournalLine VALUES('cmmnqsfsg00jd03ypj6ae088c','cmmnqsfsg00j903ypcnltjvhk',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,4583,NULL,1773336540401,1773336540401);
INSERT INTO JournalLine VALUES('cmmnqsfsi00jg03yp4t13jm31','cmmnqsfsi00je03ypt9r659aw',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',13582,0,NULL,1773336540402,1773336540402);
INSERT INTO JournalLine VALUES('cmmnqsfsi00jh03yperwjniu5','cmmnqsfsi00je03ypt9r659aw',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',951,0,NULL,1773336540402,1773336540402);
INSERT INTO JournalLine VALUES('cmmnqsfsi00ji03ypf18v8gf5','cmmnqsfsi00je03ypt9r659aw',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,14533,NULL,1773336540402,1773336540402);
INSERT INTO JournalLine VALUES('cmmnqsfsj00jl03yp6mezou1e','cmmnqsfsj00jj03ypquiwxam9',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',9207,0,NULL,1773336540403,1773336540403);
INSERT INTO JournalLine VALUES('cmmnqsfsj00jm03ypjsu662go','cmmnqsfsj00jj03ypquiwxam9',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',644,0,NULL,1773336540403,1773336540403);
INSERT INTO JournalLine VALUES('cmmnqsfsj00jn03ypwuzr3z27','cmmnqsfsj00jj03ypquiwxam9',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,9851,NULL,1773336540403,1773336540403);
INSERT INTO JournalLine VALUES('cmmnqsfsk00jq03ypsu06dbi4','cmmnqsfsk00jo03yp44a4wz5r',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',27129,0,NULL,1773336540404,1773336540404);
INSERT INTO JournalLine VALUES('cmmnqsfsk00jr03ypzppklj24','cmmnqsfsk00jo03yp44a4wz5r',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',1899,0,NULL,1773336540404,1773336540404);
INSERT INTO JournalLine VALUES('cmmnqsfsk00js03yp2o341m8r','cmmnqsfsk00jo03yp44a4wz5r',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,29028,NULL,1773336540404,1773336540404);
INSERT INTO JournalLine VALUES('cmmnqsfsl00jv03ypkqyez5wi','cmmnqsfsl00jt03yppsz92p10',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',31810,0,NULL,1773336540405,1773336540405);
INSERT INTO JournalLine VALUES('cmmnqsfsl00jw03ypc9oim80c','cmmnqsfsl00jt03yppsz92p10',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',2227,0,NULL,1773336540405,1773336540405);
INSERT INTO JournalLine VALUES('cmmnqsfsl00jx03ypyjwvzuc3','cmmnqsfsl00jt03yppsz92p10',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,34037,NULL,1773336540405,1773336540405);
INSERT INTO JournalLine VALUES('cmmnqsfsm00k003yppsap35jv','cmmnqsfsm00jy03ypmucmsaki',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',16554,0,NULL,1773336540407,1773336540407);
INSERT INTO JournalLine VALUES('cmmnqsfsm00k103yp46lsjhw1','cmmnqsfsm00jy03ypmucmsaki',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',1159,0,NULL,1773336540407,1773336540407);
INSERT INTO JournalLine VALUES('cmmnqsfsm00k203ypvjdgi80i','cmmnqsfsm00jy03ypmucmsaki',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,17713,NULL,1773336540407,1773336540407);
INSERT INTO JournalLine VALUES('cmmnqsfsn00k503ypk26g12g7','cmmnqsfsn00k303ypoj9n6ham',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',32118,0,NULL,1773336540408,1773336540408);
INSERT INTO JournalLine VALUES('cmmnqsfsn00k603ypuct03j00','cmmnqsfsn00k303ypoj9n6ham',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',2248,0,NULL,1773336540408,1773336540408);
INSERT INTO JournalLine VALUES('cmmnqsfsn00k703yp8an6epar','cmmnqsfsn00k303ypoj9n6ham',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,34366,NULL,1773336540408,1773336540408);
INSERT INTO JournalLine VALUES('cmmnqsfsp00ka03yp4zxt10c6','cmmnqsfsp00k803ypifzdt094',1,'cmmnqsfmb001k03ypdt8450eg','ต้นทุนสินค้าขาย',4753,0,NULL,1773336540409,1773336540409);
INSERT INTO JournalLine VALUES('cmmnqsfsp00kb03ypne6tx24z','cmmnqsfsp00k803ypifzdt094',2,'cmmnqsfln000f03yp063lsk4d','ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',333,0,NULL,1773336540409,1773336540409);
INSERT INTO JournalLine VALUES('cmmnqsfsp00kc03ypu347c49x','cmmnqsfsp00k803ypifzdt094',3,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',0,5086,NULL,1773336540409,1773336540409);
INSERT INTO JournalLine VALUES('cmmnqsfsq00kf03yph0h8lta2','cmmnqsfsq00kd03yp1k91h15z',1,'cmmnqsfli000703ypxj4n8ug0','เงินสดธนาคาร',13610,0,NULL,1773336540410,1773336540410);
INSERT INTO JournalLine VALUES('cmmnqsfsq00kg03yp7ozwczkg','cmmnqsfsq00kd03yp1k91h15z',2,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',0,13610,NULL,1773336540410,1773336540410);
INSERT INTO JournalLine VALUES('cmmnqsfsr00kj03ypsn3e8wis','cmmnqsfsr00kh03ypo1riy50f',1,'cmmnqsfli000703ypxj4n8ug0','เงินสดธนาคาร',4931,0,NULL,1773336540412,1773336540412);
INSERT INTO JournalLine VALUES('cmmnqsfsr00kk03ypb5f3m4uz','cmmnqsfsr00kh03ypo1riy50f',2,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',0,4931,NULL,1773336540412,1773336540412);
INSERT INTO JournalLine VALUES('cmmnqsfst00kn03ypgp9omia0','cmmnqsfss00kl03ypnaz19sa1',1,'cmmnqsflj000803ypcmniun24','เงินสดธนาคาร',40871,0,NULL,1773336540413,1773336540413);
INSERT INTO JournalLine VALUES('cmmnqsfst00ko03ypurs93yei','cmmnqsfss00kl03ypnaz19sa1',2,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',0,40871,NULL,1773336540413,1773336540413);
INSERT INTO JournalLine VALUES('cmmnqsfsu00kr03yppuy595zo','cmmnqsfsu00kp03ypqfulca8h',1,'cmmnqsflj000803ypcmniun24','เงินสดธนาคาร',37701,0,NULL,1773336540414,1773336540414);
INSERT INTO JournalLine VALUES('cmmnqsfsu00ks03yp39fcd9qx','cmmnqsfsu00kp03ypqfulca8h',2,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',0,37701,NULL,1773336540414,1773336540414);
INSERT INTO JournalLine VALUES('cmmnqsfsv00kv03yp4nvwr28j','cmmnqsfsv00kt03yp35px1oio',1,'cmmnqsfli000703ypxj4n8ug0','เงินสดธนาคาร',31102,0,NULL,1773336540415,1773336540415);
INSERT INTO JournalLine VALUES('cmmnqsfsv00kw03ypj17zct80','cmmnqsfsv00kt03yp35px1oio',2,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',0,31102,NULL,1773336540415,1773336540415);
INSERT INTO JournalLine VALUES('cmmnqsfsw00kz03ypi0thohf4','cmmnqsfsw00kx03ypxk8cldgj',1,'cmmnqsflj000803ypcmniun24','เงินสดธนาคาร',43026,0,NULL,1773336540416,1773336540416);
INSERT INTO JournalLine VALUES('cmmnqsfsw00l003ypzid2usaa','cmmnqsfsw00kx03ypxk8cldgj',2,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',0,43026,NULL,1773336540416,1773336540416);
INSERT INTO JournalLine VALUES('cmmnqsfsx00l303ypy24dk5u3','cmmnqsfsx00l103yp0i4upmpn',1,'cmmnqsflj000803ypcmniun24','เงินสดธนาคาร',18571,0,NULL,1773336540418,1773336540418);
INSERT INTO JournalLine VALUES('cmmnqsfsx00l403ypltu2o9j5','cmmnqsfsx00l103yp0i4upmpn',2,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',0,18571,NULL,1773336540418,1773336540418);
INSERT INTO JournalLine VALUES('cmmnqsfsy00l703yp5nlklxac','cmmnqsfsy00l503yp9e6g00z6',1,'cmmnqsflj000803ypcmniun24','เงินสดธนาคาร',4513,0,NULL,1773336540419,1773336540419);
INSERT INTO JournalLine VALUES('cmmnqsfsy00l803yp6fa1om4d','cmmnqsfsy00l503yp9e6g00z6',2,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',0,4513,NULL,1773336540419,1773336540419);
INSERT INTO JournalLine VALUES('cmmnqsfsz00lb03ypegvq9xxw','cmmnqsfsz00l903ypehekjeub',1,'cmmnqsflj000803ypcmniun24','เงินสดธนาคาร',11472,0,NULL,1773336540420,1773336540420);
INSERT INTO JournalLine VALUES('cmmnqsfsz00lc03ypwkdrhqai','cmmnqsfsz00l903ypehekjeub',2,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',0,11472,NULL,1773336540420,1773336540420);
INSERT INTO JournalLine VALUES('cmmnqsft100lf03yp3a5t9e3i','cmmnqsft100ld03yp3fa83tkl',1,'cmmnqsfli000703ypxj4n8ug0','เงินสดธนาคาร',11838,0,NULL,1773336540421,1773336540421);
INSERT INTO JournalLine VALUES('cmmnqsft100lg03yp7but880h','cmmnqsft100ld03yp3fa83tkl',2,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',0,11838,NULL,1773336540421,1773336540421);
INSERT INTO JournalLine VALUES('cmmnqsft200lj03ypxyo5xmza','cmmnqsft200lh03ypof5cw4ld',1,'cmmnqsflj000803ypcmniun24','เงินสดธนาคาร',37963,0,NULL,1773336540422,1773336540422);
INSERT INTO JournalLine VALUES('cmmnqsft200lk03ypsmuf2diz','cmmnqsft200lh03ypof5cw4ld',2,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',0,37963,NULL,1773336540422,1773336540422);
INSERT INTO JournalLine VALUES('cmmnqsft300ln03ypdsoepbmm','cmmnqsft300ll03ypd054g39k',1,'cmmnqsfli000703ypxj4n8ug0','เงินสดธนาคาร',5019,0,NULL,1773336540423,1773336540423);
INSERT INTO JournalLine VALUES('cmmnqsft300lo03yp2zq8frc5','cmmnqsft300ll03ypd054g39k',2,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',0,5019,NULL,1773336540423,1773336540423);
INSERT INTO JournalLine VALUES('cmmnqsft400lr03ypo1k12fu9','cmmnqsft400lp03ypo7vxsz7l',1,'cmmnqsflj000803ypcmniun24','เงินสดธนาคาร',38638,0,NULL,1773336540424,1773336540424);
INSERT INTO JournalLine VALUES('cmmnqsft400ls03ypzxkxa7wm','cmmnqsft400lp03ypo7vxsz7l',2,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',0,38638,NULL,1773336540424,1773336540424);
INSERT INTO JournalLine VALUES('cmmnqsft500lv03yp5oxgowjg','cmmnqsft500lt03ypw6grxu4k',1,'cmmnqsfli000703ypxj4n8ug0','เงินสดธนาคาร',8947,0,NULL,1773336540425,1773336540425);
INSERT INTO JournalLine VALUES('cmmnqsft500lw03ypfaxkq46w','cmmnqsft500lt03ypw6grxu4k',2,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',0,8947,NULL,1773336540425,1773336540425);
INSERT INTO JournalLine VALUES('cmmnqsft600lz03ypiet5mua9','cmmnqsft600lx03ypbhetvsch',1,'cmmnqsflj000803ypcmniun24','เงินสดธนาคาร',22031,0,NULL,1773336540426,1773336540426);
INSERT INTO JournalLine VALUES('cmmnqsft600m003ypqkr25oxn','cmmnqsft600lx03ypbhetvsch',2,'cmmnqsfll000b03ypvp5zkd9k','ลูกหนี้การค้า',0,22031,NULL,1773336540426,1773336540426);
INSERT INTO JournalLine VALUES('cmmnqsft700m303ypehbtnjrh','cmmnqsft700m103yptdi34mtd',1,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',22604,0,NULL,1773336540427,1773336540427);
INSERT INTO JournalLine VALUES('cmmnqsft700m403yp7gv4hjln','cmmnqsft700m103yptdi34mtd',2,'cmmnqsflj000803ypcmniun24','เงินสดธนาคาร',0,22604,NULL,1773336540427,1773336540427);
INSERT INTO JournalLine VALUES('cmmnqsft800m703ypnc1hvq10','cmmnqsft800m503yp5481fsp8',1,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',4638,0,NULL,1773336540428,1773336540428);
INSERT INTO JournalLine VALUES('cmmnqsft800m803yp1t4g1lsk','cmmnqsft800m503yp5481fsp8',2,'cmmnqsfli000703ypxj4n8ug0','เงินสดธนาคาร',0,4638,NULL,1773336540428,1773336540428);
INSERT INTO JournalLine VALUES('cmmnqsft900mb03ypa5rjgc8g','cmmnqsft900m903yp85dx0fa7',1,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',11654,0,NULL,1773336540429,1773336540429);
INSERT INTO JournalLine VALUES('cmmnqsft900mc03ypetko8hj4','cmmnqsft900m903yp85dx0fa7',2,'cmmnqsfli000703ypxj4n8ug0','เงินสดธนาคาร',0,11654,NULL,1773336540429,1773336540429);
INSERT INTO JournalLine VALUES('cmmnqsfta00mf03yp99dlp6i7','cmmnqsfta00md03ypyfta7d73',1,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',15708,0,NULL,1773336540431,1773336540431);
INSERT INTO JournalLine VALUES('cmmnqsfta00mg03ypomhpuom0','cmmnqsfta00md03ypyfta7d73',2,'cmmnqsfli000703ypxj4n8ug0','เงินสดธนาคาร',0,15708,NULL,1773336540431,1773336540431);
INSERT INTO JournalLine VALUES('cmmnqsftb00mj03yp59nzaw9w','cmmnqsftb00mh03ypeve9k4mr',1,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',17585,0,NULL,1773336540432,1773336540432);
INSERT INTO JournalLine VALUES('cmmnqsftb00mk03ypyc5yu2hg','cmmnqsftb00mh03ypeve9k4mr',2,'cmmnqsflj000803ypcmniun24','เงินสดธนาคาร',0,17585,NULL,1773336540432,1773336540432);
INSERT INTO JournalLine VALUES('cmmnqsftc00mn03ypk5ozs65m','cmmnqsftc00ml03ypt7sj7cta',1,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',12432,0,NULL,1773336540433,1773336540433);
INSERT INTO JournalLine VALUES('cmmnqsftc00mo03yph51dz02v','cmmnqsftc00ml03ypt7sj7cta',2,'cmmnqsfli000703ypxj4n8ug0','เงินสดธนาคาร',0,12432,NULL,1773336540433,1773336540433);
INSERT INTO JournalLine VALUES('cmmnqsftd00mr03ypvmeerr9f','cmmnqsftd00mp03yp352wtcn2',1,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',9084,0,NULL,1773336540434,1773336540434);
INSERT INTO JournalLine VALUES('cmmnqsftd00ms03ypomk5x54x','cmmnqsftd00mp03yp352wtcn2',2,'cmmnqsfli000703ypxj4n8ug0','เงินสดธนาคาร',0,9084,NULL,1773336540434,1773336540434);
INSERT INTO JournalLine VALUES('cmmnqsftf00mv03ypssqjv53k','cmmnqsftf00mt03ypf6rgxqls',1,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',14716,0,NULL,1773336540435,1773336540435);
INSERT INTO JournalLine VALUES('cmmnqsftf00mw03yp1niqun56','cmmnqsftf00mt03ypf6rgxqls',2,'cmmnqsflj000803ypcmniun24','เงินสดธนาคาร',0,14716,NULL,1773336540435,1773336540435);
INSERT INTO JournalLine VALUES('cmmnqsftg00mz03ypolpbe0yh','cmmnqsftg00mx03ypfse9ieok',1,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',25540,0,NULL,1773336540436,1773336540436);
INSERT INTO JournalLine VALUES('cmmnqsftg00n003ypoldk6hxu','cmmnqsftg00mx03ypfse9ieok',2,'cmmnqsflj000803ypcmniun24','เงินสดธนาคาร',0,25540,NULL,1773336540436,1773336540436);
INSERT INTO JournalLine VALUES('cmmnqsfth00n303ypcpexk4mo','cmmnqsfth00n103yp8njrh6di',1,'cmmnqsflu000s03yphef7yzb3','เจ้าหนี้การค้า',18133,0,NULL,1773336540437,1773336540437);
INSERT INTO JournalLine VALUES('cmmnqsfth00n403yp3zo692at','cmmnqsfth00n103yp8njrh6di',2,'cmmnqsflj000803ypcmniun24','เงินสดธนาคาร',0,18133,NULL,1773336540437,1773336540437);
INSERT INTO JournalLine VALUES('cmmnqsfti00n703yp1kne04yn','cmmnqsfti00n503ypird2kna7',1,'cmmnqsfme001q03ypqqsp56c3','เงินเดือนและค่าจ้าง',59070,0,NULL,1773336540439,1773336540439);
INSERT INTO JournalLine VALUES('cmmnqsfti00n803yp9wmhjxlr','cmmnqsfti00n503ypird2kna7',2,'cmmnqsfly000y03yp6zoaavp1','เงินเดือนต้องจ่าย',0,59070,NULL,1773336540439,1773336540439);
INSERT INTO JournalLine VALUES('cmmnqsftj00nb03yp1q1rtv66','cmmnqsftj00n903ypf3gycdml',1,'cmmnqsfme001q03ypqqsp56c3','เงินเดือนและค่าจ้าง',60439,0,NULL,1773336540440,1773336540440);
INSERT INTO JournalLine VALUES('cmmnqsftj00nc03ypdvayrba5','cmmnqsftj00n903ypf3gycdml',2,'cmmnqsfly000y03yp6zoaavp1','เงินเดือนต้องจ่าย',0,60439,NULL,1773336540440,1773336540440);
INSERT INTO JournalLine VALUES('cmmnqsftk00nf03ypc8c0vzu2','cmmnqsftk00nd03ypzxi5v3d8',1,'cmmnqsfmj001y03yprezzs8ut','ค่าเสื่อมราคา',4013,0,NULL,1773336540441,1773336540441);
INSERT INTO JournalLine VALUES('cmmnqsftk00ng03yp5gqobfyu','cmmnqsftk00nd03ypzxi5v3d8',2,'cmmnqsflq000l03ypgv9rhm1o','ค่าเสื่อมราคาอาคารสะสม',0,4013,NULL,1773336540441,1773336540441);
INSERT INTO JournalLine VALUES('cmmnqsftm00nj03ypto50x9jk','cmmnqsftl00nh03ypvc079qv0',1,'cmmnqsfmg001s03ypt02h6f34','ค่าน้ำประปา',1283.700000000000045,0,NULL,1773336540442,1773336540442);
INSERT INTO JournalLine VALUES('cmmnqsftm00nk03ypmfftxus5','cmmnqsftl00nh03ypvc079qv0',2,'cmmnqsfmg001t03ypc7k8q9b0','ค่าไฟฟ้า',2995.300000000000181,0,NULL,1773336540442,1773336540442);
INSERT INTO JournalLine VALUES('cmmnqsftm00nl03yprs4nruk2','cmmnqsftl00nh03ypvc079qv0',3,'cmmnqsflk000903ypwink1s8o','เงินสดย่อย',0,4279,NULL,1773336540442,1773336540442);
INSERT INTO JournalLine VALUES('cmmnqsfto00no03ypsyd6dmj0','cmmnqsftn00nm03ypjyw7g203',1,'cmmnqsfme001q03ypqqsp56c3','เงินเดือนและค่าจ้าง',108203,0,NULL,1773336540444,1773336540444);
INSERT INTO JournalLine VALUES('cmmnqsfto00np03ypiss8s2qc','cmmnqsftn00nm03ypjyw7g203',2,'cmmnqsfly000y03yp6zoaavp1','เงินเดือนต้องจ่าย',0,108203,NULL,1773336540444,1773336540444);
INSERT INTO JournalLine VALUES('cmmnqsftp00ns03ypz04sft8z','cmmnqsftp00nq03ypzjaj5iv6',1,'cmmnqsfml002103ypqyo9cq6w','ค่าธรรมเนียมธนาคาร',335,0,NULL,1773336540445,1773336540445);
INSERT INTO JournalLine VALUES('cmmnqsftp00nt03ypufcj93lm','cmmnqsftp00nq03ypzjaj5iv6',2,'cmmnqsfli000703ypxj4n8ug0','ธนาคารกรุงเทพ',0,335,NULL,1773336540445,1773336540445);
INSERT INTO JournalLine VALUES('cmmnqsftq00nw03yp9bd3wyhf','cmmnqsftq00nu03ypyzl9oxn5',1,'cmmnqsfme001q03ypqqsp56c3','เงินเดือนและค่าจ้าง',109492,0,NULL,1773336540446,1773336540446);
INSERT INTO JournalLine VALUES('cmmnqsftq00nx03ypu2o1k4qh','cmmnqsftq00nu03ypyzl9oxn5',2,'cmmnqsfly000y03yp6zoaavp1','เงินเดือนต้องจ่าย',0,109492,NULL,1773336540446,1773336540446);
INSERT INTO JournalLine VALUES('cmmnqsftr00o003yp5pp017a9','cmmnqsftr00ny03ypv1x74iua',1,'cmmnqsfmf001r03yp9c0dzgyh','ค่าเช่าอาคาร',22230,0,NULL,1773336540447,1773336540447);
INSERT INTO JournalLine VALUES('cmmnqsftr00o103yp9y71n9bp','cmmnqsftr00ny03ypv1x74iua',2,'cmmnqsflu000s03yphef7yzb3','ค่าใช้จ่ายจ่ายล่วงหน้า - ค่าเช่า',0,22230,NULL,1773336540447,1773336540447);
INSERT INTO JournalLine VALUES('cmmnqsfts00o403ypenbklm8v','cmmnqsfts00o203yp0qqcdnjz',1,'cmmnqsfml002103ypqyo9cq6w','ค่าธรรมเนียมธนาคาร',101,0,NULL,1773336540449,1773336540449);
INSERT INTO JournalLine VALUES('cmmnqsfts00o503yp8lj3ty91','cmmnqsfts00o203yp0qqcdnjz',2,'cmmnqsfli000703ypxj4n8ug0','ธนาคารกรุงเทพ',0,101,NULL,1773336540449,1773336540449);
INSERT INTO JournalLine VALUES('cmmnqsftu00o803ypuazzeujv','cmmnqsftt00o603ypgkwq91f4',1,'cmmnqsfmf001r03yp9c0dzgyh','ค่าเช่าอาคาร',44457,0,NULL,1773336540450,1773336540450);
INSERT INTO JournalLine VALUES('cmmnqsftu00o903yp7r9swoar','cmmnqsftt00o603ypgkwq91f4',2,'cmmnqsflu000s03yphef7yzb3','ค่าใช้จ่ายจ่ายล่วงหน้า - ค่าเช่า',0,44457,NULL,1773336540450,1773336540450);
INSERT INTO JournalLine VALUES('cmmnqsftv00oc03ypqet6q7n4','cmmnqsftv00oa03ypqcb87bgk',1,'cmmnqsfln000e03yp74wkjvpi','ดอกเบี้ยรับมัดจำ',1528,0,NULL,1773336540451,1773336540451);
INSERT INTO JournalLine VALUES('cmmnqsftv00od03ypm1fbkhjo','cmmnqsftv00oa03ypqcb87bgk',2,'cmmnqsfm8001f03yppgrlcmrl','ดอกเบี้ยรับ',0,1528,NULL,1773336540451,1773336540451);
INSERT INTO JournalLine VALUES('cmmnqsftw00og03yprtcukl4d','cmmnqsftw00oe03ypzhky1mfi',1,'cmmnqsfln000e03yp74wkjvpi','ดอกเบี้ยรับมัดจำ',1683,0,NULL,1773336540452,1773336540452);
INSERT INTO JournalLine VALUES('cmmnqsftw00oh03ypwx4ssjbu','cmmnqsftw00oe03ypzhky1mfi',2,'cmmnqsfm8001f03yppgrlcmrl','ดอกเบี้ยรับ',0,1683,NULL,1773336540452,1773336540452);
INSERT INTO JournalLine VALUES('cmmnqsftx00ok03yp70va60nw','cmmnqsftx00oi03yptv44zjs0',1,'cmmnqsflo000h03ypfc04m9ff','ค่าใช้จ่ายจ่ายล่วงหน้า',5165,0,NULL,1773336540454,1773336540454);
INSERT INTO JournalLine VALUES('cmmnqsftx00ol03ypk3k51dsf','cmmnqsftx00oi03yptv44zjs0',2,'cmmnqsfli000703ypxj4n8ug0','ธนาคารกรุงเทพ',0,5165,NULL,1773336540454,1773336540454);
INSERT INTO JournalLine VALUES('cmmnqsfty00oo03ypjb64fjeu','cmmnqsfty00om03yp3r3u0swr',1,'cmmnqsflo000h03ypfc04m9ff','ค่าใช้จ่ายจ่ายล่วงหน้า',8587,0,NULL,1773336540455,1773336540455);
INSERT INTO JournalLine VALUES('cmmnqsfty00op03ypadcqdb35','cmmnqsfty00om03yp3r3u0swr',2,'cmmnqsfli000703ypxj4n8ug0','ธนาคารกรุงเทพ',0,8587,NULL,1773336540455,1773336540455);
INSERT INTO JournalLine VALUES('cmmnqsftz00os03yp0pld2wmy','cmmnqsftz00oq03ypxxth34fy',1,'cmmnqsfmk002003yp0e1jq3h6','ดอกเบี้ยจ่าย',1006,0,NULL,1773336540456,1773336540456);
INSERT INTO JournalLine VALUES('cmmnqsftz00ot03yp3uv3ocxn','cmmnqsftz00oq03ypxxth34fy',2,'cmmnqsflw000v03ypgosemifi','ดอกเบี้ยจ่ายต้องชำระ',0,1006,NULL,1773336540456,1773336540456);
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentNo" TEXT NOT NULL,
    "paymentDate" DATETIME NOT NULL,
    "vendorId" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "bankAccountId" TEXT,
    "chequeNo" TEXT,
    "chequeDate" DATETIME,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "whtAmount" INTEGER NOT NULL DEFAULT 0,
    "unallocated" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "idempotencyKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "journalEntryId" TEXT,
    "currencyId" TEXT,
    "exchangeRate" REAL NOT NULL DEFAULT 1,
    "foreignAmount" INTEGER,
    CONSTRAINT "Payment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "PaymentAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "whtRate" REAL NOT NULL DEFAULT 0,
    "whtAmount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "PurchaseInvoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Payroll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "baseSalary" INTEGER NOT NULL,
    "additions" INTEGER NOT NULL,
    "deductions" INTEGER NOT NULL,
    "socialSecurity" INTEGER NOT NULL,
    "withholdingTax" INTEGER NOT NULL,
    "netPay" INTEGER NOT NULL,
    "payslipUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payroll_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payroll_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "PayrollRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runNo" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "paymentDate" DATETIME NOT NULL,
    "totalBaseSalary" INTEGER NOT NULL,
    "totalAdditions" INTEGER NOT NULL,
    "totalDeductions" INTEGER NOT NULL,
    "totalSsc" INTEGER NOT NULL,
    "totalTax" INTEGER NOT NULL,
    "totalNetPay" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "journalEntryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PayrollRun_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "PettyCashFund" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "custodianId" TEXT NOT NULL,
    "glAccountId" TEXT NOT NULL,
    "maxAmount" INTEGER NOT NULL,
    "currentBalance" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PettyCashFund_custodianId_fkey" FOREIGN KEY ("custodianId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "PettyCashVoucher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voucherNo" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "amount" INTEGER NOT NULL,
    "payee" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "glExpenseAccountId" TEXT NOT NULL,
    "journalEntryId" TEXT,
    "isReimbursed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PettyCashVoucher_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "PettyCashFund" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PettyCashVoucher_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "category" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'ชิ้น',
    "type" TEXT NOT NULL DEFAULT 'PRODUCT',
    "salePrice" INTEGER NOT NULL DEFAULT 0,
    "costPrice" INTEGER NOT NULL DEFAULT 0,
    "vatRate" REAL NOT NULL DEFAULT 7,
    "vatType" TEXT NOT NULL DEFAULT 'EXCLUSIVE',
    "isInventory" BOOLEAN NOT NULL DEFAULT false,
    "quantity" REAL NOT NULL DEFAULT 0,
    "minQuantity" REAL NOT NULL DEFAULT 0,
    "incomeType" TEXT,
    "costingMethod" TEXT NOT NULL DEFAULT 'WEIGHTED_AVERAGE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO Product VALUES('cmmnqsfo1002j03ypg1mqpq7i','P001','สินค้าตัวอย่าง A',NULL,NULL,NULL,'ชิ้น','PRODUCT',1000,700,7.0,'EXCLUSIVE',0,0.0,0.0,NULL,'WEIGHTED_AVERAGE',1,NULL,NULL,NULL,NULL,1773336540242,1773336540242);
INSERT INTO Product VALUES('cmmnqsfo3002k03yp3qbfcti2','P002','สินค้าตัวอย่าง B',NULL,NULL,NULL,'ชุด','PRODUCT',2500,1800,7.0,'EXCLUSIVE',0,0.0,0.0,NULL,'WEIGHTED_AVERAGE',1,NULL,NULL,NULL,NULL,1773336540243,1773336540243);
INSERT INTO Product VALUES('cmmnqsfo3002l03yppmp94g7o','S001','ค่าบริการให้คำปรึกษา',NULL,NULL,NULL,'ครั้ง','SERVICE',5000,0,7.0,'EXCLUSIVE',0,0.0,0.0,NULL,'WEIGHTED_AVERAGE',1,NULL,NULL,NULL,NULL,1773336540244,1773336540244);
INSERT INTO Product VALUES('cmmnqsfo4002m03yptdzlnzkj','S002','ค่าบริการซ่อมบำรุง',NULL,NULL,NULL,'ครั้ง','SERVICE',3000,0,7.0,'EXCLUSIVE',0,0.0,0.0,NULL,'WEIGHTED_AVERAGE',1,NULL,NULL,NULL,NULL,1773336540244,1773336540244);
CREATE TABLE IF NOT EXISTS "ProductCostHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "oldUnitCost" INTEGER NOT NULL,
    "newUnitCost" INTEGER NOT NULL,
    "reason" TEXT,
    "referenceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductCostHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "PurchaseInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNo" TEXT NOT NULL,
    "vendorInvoiceNo" TEXT,
    "invoiceDate" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "vendorId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TAX_INVOICE',
    "reference" TEXT,
    "poNumber" TEXT,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "vatRate" REAL NOT NULL DEFAULT 7,
    "vatRateType" TEXT NOT NULL DEFAULT 'STANDARD_7',
    "vatAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "withholdingRate" REAL NOT NULL DEFAULT 0,
    "withholdingAmount" INTEGER NOT NULL DEFAULT 0,
    "netAmount" INTEGER NOT NULL DEFAULT 0,
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "internalNotes" TEXT,
    "sourceChannel" TEXT,
    "metadata" JSONB,
    "createdById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "journalEntryId" TEXT,
    CONSTRAINT "PurchaseInvoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseInvoice_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "PurchaseInvoiceLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'ชิ้น',
    "unitPrice" INTEGER NOT NULL DEFAULT 0,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "vatRate" REAL NOT NULL DEFAULT 7,
    "vatAmount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseInvoiceLine_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "PurchaseInvoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseInvoiceLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Receipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptNo" TEXT NOT NULL,
    "receiptDate" DATETIME NOT NULL,
    "customerId" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "bankAccountId" TEXT,
    "chequeNo" TEXT,
    "chequeDate" DATETIME,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "whtAmount" INTEGER NOT NULL DEFAULT 0,
    "unallocated" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "journalEntryId" TEXT,
    "idempotencyKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "currencyId" TEXT,
    "exchangeRate" REAL NOT NULL DEFAULT 1,
    "foreignAmount" INTEGER,
    CONSTRAINT "Receipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Receipt_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Receipt_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Receipt_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ReceiptAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "whtRate" REAL NOT NULL DEFAULT 0,
    "whtAmount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReceiptAllocation_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReceiptAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Reconciliation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "reference" TEXT,
    "debitId" TEXT,
    "debitType" TEXT,
    "creditId" TEXT,
    "creditType" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "matchedAt" DATETIME,
    "matchedById" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "StockBalance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 0,
    "unitCost" INTEGER NOT NULL DEFAULT 0,
    "totalCost" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StockBalance_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockBalance_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO StockBalance VALUES('cmmua0q4z009prq6bmc00512c','cmmnqsfo1002j03ypg1mqpq7i','cmmua0928009nrq6b7t5pvkys',100.0,50,5000,1773731636818);
INSERT INTO StockBalance VALUES('cmmuaodnm009trq6bmce8187a','cmmnqsfo3002k03yp3qbfcti2','cmmua0928009nrq6b7t5pvkys',44.0,136,6000,1773732791920);
CREATE TABLE IF NOT EXISTS "StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitCost" INTEGER NOT NULL,
    "totalCost" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "referenceId" TEXT,
    "referenceNo" TEXT,
    "sourceChannel" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT DEFAULT 'THB',
    "exchangeRate" REAL DEFAULT 1.0,
    "foreignCost" INTEGER,
    CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO StockMovement VALUES('cmmua0q50009rrq6b8aumgqsz','cmmnqsfo1002j03ypg1mqpq7i','cmmua0928009nrq6b7t5pvkys','RECEIVE',100.0,50,5000,1773731636820,NULL,NULL,'WEB','รับสินค้าเข้าคลัง',NULL,1773731636821,'THB',1.0,NULL);
INSERT INTO StockMovement VALUES('cmmuaodnq009vrq6bgqhozvrs','cmmnqsfo3002k03yp3qbfcti2','cmmua0928009nrq6b7t5pvkys','RECEIVE',44.0,300,13200,1773732740389,NULL,NULL,'WEB','sdf',NULL,1773732740390,'THB',1.0,NULL);
INSERT INTO StockMovement VALUES('cmmuap4es009zrq6bhs30ldw5','cmmnqsfo3002k03yp3qbfcti2','cmmua0928009nrq6b7t5pvkys','ISSUE',30.0,60,1800,1773732775059,NULL,NULL,'WEB','',NULL,1773732775060,'THB',1.0,NULL);
INSERT INTO StockMovement VALUES('cmmuaphf700a3rq6b31ym807w','cmmnqsfo3002k03yp3qbfcti2','cmmua0928009nrq6b7t5pvkys','RECEIVE',30.0,60,1800,1773732791922,'cmmuap4es009zrq6bhs30ldw5','REV-cmmuap4e','WEB','ยกเลิกการเคลื่อนไหวเดิม: -',NULL,1773732791923,'THB',1.0,NULL);
CREATE TABLE IF NOT EXISTS "StockTakeLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stockTakeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "expectedQty" REAL NOT NULL,
    "actualQty" REAL NOT NULL,
    "varianceQty" REAL NOT NULL,
    "varianceValue" INTEGER NOT NULL,
    "costPerUnit" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StockTakeLine_stockTakeId_fkey" FOREIGN KEY ("stockTakeId") REFERENCES "StockTake" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockTakeLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "mfaSecret" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaVerifiedAt" DATETIME,
    "maxSessions" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO User VALUES('cmmnqsfl8000003yp8yo84l46','admin@thaiaccounting.com','$2b$10$SeNJX6EoyYJ1ry8BiK37IeLwaLARPgk1PBFXoA4ew5rp5rI12PAAa','ผู้ดูแลระบบ','ADMIN',1,1773731526957,NULL,0,NULL,3,1773336540141,1773731526958);
INSERT INTO User VALUES('cmmnqsfld000103yp3d86suci','accountant@thaiaccounting.com','$2b$10$EKfRglPnA/eJzJKgUcJ4HO2esBMpmJMoDAIdvLgPWXbzXrHc/t1rO','นักบัญชี ทดสอบ','ACCOUNTANT',1,1773727387882,NULL,0,NULL,3,1773336540145,1773727387883);
INSERT INTO User VALUES('cmmnqsfld000203yp9v7ir4ts','user@thaiaccounting.com','$2b$10$Krz0NNApCw3t7nw9L9upM..lnNCkOBO68Eve9NaL66Z4uKKqmAEEe','ผู้ใช้ทั่วไป','USER',1,1773727386999,NULL,0,NULL,3,1773336540146,1773727386999);
INSERT INTO User VALUES('cmmnqsfle000303yp8iavv5sw','viewer@thaiaccounting.com','$2b$10$aaApdqj911fv19xm9.BG5uSjGCizlsUjyDlNquwxe3TkB9KKVC3zy','ผู้ดูเท่านั้น','VIEWER',1,1773727393500,NULL,0,NULL,3,1773336540147,1773727393501);
CREATE TABLE IF NOT EXISTS "UserSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "rotatedFrom" TEXT
);
INSERT INTO UserSession VALUES('cmmu37t3q0000rqmgi7p1e23u','cmmnqsfl8000003yp8yo84l46','kzR81SCR2S9RyfsoqKBvAsDUhb69PVFLqpBICed3PjpDXGRw','127.0.0.1','curl/8.7.1',1773720209943,1773720209943,1773749009942,0,NULL);
INSERT INTO UserSession VALUES('cmmu38xz40005rqmgm1nocq0y','cmmnqsfl8000003yp8yo84l46','2O0XUa3Z5RWVlpoWRjQjI25gJvTHC1lnXrNoQb76FfEGUyap','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773720262913,1773720262913,1773749062912,0,NULL);
INSERT INTO UserSession VALUES('cmmu38xz40004rqmg9bg06w6q','cmmnqsfl8000003yp8yo84l46','YqLAajfHai3qq3sDyJzLLnUM7b7B9u44KRX7HZk6OMZ9uCtN','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773720262912,1773720262912,1773749062912,0,NULL);
INSERT INTO UserSession VALUES('cmmu38xz40003rqmgx1ef7xm0','cmmnqsfl8000003yp8yo84l46','TcqMCZlFj710gO3OYbjSOXs8TWJb3QQpl3FjwjmZE6Ah2z0x','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773720262912,1773720262912,1773749062910,0,NULL);
INSERT INTO UserSession VALUES('cmmu38y1g000crqmgsd0ks2hf','cmmnqsfl8000003yp8yo84l46','MkGwxZUipGgS2MvivFQpJNHe7d4LR5Ayy0u6sDqLJGJWUUHZ','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773720262997,1773720262997,1773749062994,0,NULL);
INSERT INTO UserSession VALUES('cmmu39clu000frqmg4gspv8r6','cmmnqsfl8000003yp8yo84l46','ViDkpbQbdEJdcpp7JbthLrDJVqM010l1er7OFoFQU0QkfUzz','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773720281874,1773720281874,1773749081872,0,NULL);
INSERT INTO UserSession VALUES('cmmu39cm9000jrqmgcpwms2zd','cmmnqsfl8000003yp8yo84l46','L0DBvI3sHvUsIjoUDRLcMfaA7rZyyiWmgH9LHMNkBjzK17Oj','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773720281890,1773720281890,1773749081888,0,NULL);
INSERT INTO UserSession VALUES('cmmu39cn4000mrqmg1bosuqpn','cmmnqsfl8000003yp8yo84l46','vUFwe8d4avA9NtWMm80jxdr69LNmQLiX1weuQ1o7p2PETtQE','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773720281921,1773720281921,1773749081919,0,NULL);
INSERT INTO UserSession VALUES('cmmu39clw000grqmgyfxra3ns','cmmnqsfl8000003yp8yo84l46','o0i0dYDDWkmHR8kplB0v8Se5IH2LGQVggafEB6wOKH3vV449','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773720281877,1773720281877,1773749081876,0,NULL);
INSERT INTO UserSession VALUES('cmmu39q69000rrqmgv40uq4iu','cmmnqsfl8000003yp8yo84l46','2PgiafVKnxjurYA9VsRuue6XoU6GcIpKm05lr3KVlVgxdJ6y','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773720299458,1773720299458,1773749099456,0,NULL);
INSERT INTO UserSession VALUES('cmmu39q6a000srqmgppi0hocv','cmmnqsfl8000003yp8yo84l46','shnRsOCK3oTjaVOTHnSQcC1uzO1gCEF2MxyambJuwaMlnCLw','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773720299459,1773720299459,1773749099458,0,NULL);
INSERT INTO UserSession VALUES('cmmu39q7h000xrqmg1430gwz4','cmmnqsfl8000003yp8yo84l46','sg0Z3f7uEsqsDw6Hp4p9jLb0RUprBs9LOhVva1kmmJKFLunf','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773720299501,1773720299501,1773749099500,0,NULL);
INSERT INTO UserSession VALUES('cmmu39q9m000yrqmgupf32nqw','cmmnqsfl8000003yp8yo84l46','OH7ylMRdUZe40JNauOZlKr6rf2AVCLQL7peiGVzKGsfJ0xRU','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773720299578,1773720299578,1773749099577,0,NULL);
INSERT INTO UserSession VALUES('cmmu39x1o0014rqmgmbdnlrsj','cmmnqsfl8000003yp8yo84l46','YMybGPFyxWIPPJnmyBaxtGRx9fRUo16xAa1NDVKonWR7FoxA','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773720308364,1773720308364,1773749108362,0,NULL);
INSERT INTO UserSession VALUES('cmmu39x1m0013rqmg39ltwo90','cmmnqsfl8000003yp8yo84l46','QDKShbQzcS77CrIpC7NkX4iTyrkZk2ekRagEURLd7kcxDvcb','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773720308363,1773720308363,1773749108362,0,NULL);
INSERT INTO UserSession VALUES('cmmu39zt80019rqmg3h5gzhzj','cmmnqsfl8000003yp8yo84l46','UrNh2LFw61zbzxZDqkAqU8oopExZY7jg68lEScNz3oP96mi2','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773720311947,1773720311947,1773749111944,0,NULL);
INSERT INTO UserSession VALUES('cmmu3a024001crqmgnrile5e5','cmmnqsfl8000003yp8yo84l46','N8fJkLIK2QsG6BxrL0VmQsPTAVHTLKU675cFboolJ9URMWvw','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773720312269,1773720312269,1773749112268,0,NULL);
INSERT INTO UserSession VALUES('cmmu3awku001frqmg1h6qrg5a','cmmnqsfld000103yp3d86suci','PdSe2zHkCNbaqFK2vhD03ppTt71cd9z113WLBNBYUlpgSyiq','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773720354415,1773720354415,1773749154414,0,NULL);
INSERT INTO UserSession VALUES('cmmu3fvz6001irqmg0cf4pciy','cmmnqsfl8000003yp8yo84l46','JRSXQYSaafbA4YcPaJ3Ze0Jv3HQQnUHe4QVAxTCpFNycVfXR','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',1773720586914,1773720586914,1773749386914,0,NULL);
INSERT INTO UserSession VALUES('cmmu3p22a0000rqzh7hdfxrai','cmmnqsfl8000003yp8yo84l46','a9y61TJ6UPqUIT8GFJik5xRrfySTOFV91w45qyVc8vjZTgn5','127.0.0.1','curl/8.7.1',1773721014706,1773721014706,1773749814705,0,NULL);
INSERT INTO UserSession VALUES('cmmu3q1rc0003rqzhhjcl919l','cmmnqsfl8000003yp8yo84l46','fhmpJGUfCSCigCvIoT53ONUqEGRZyEGX6BWP5TVujXUxBjtq','127.0.0.1','curl/8.7.1',1773721060968,1773721060968,1773749860968,0,NULL);
INSERT INTO UserSession VALUES('cmmu3q46r0006rqzhs1z1mbyd','cmmnqsfl8000003yp8yo84l46','LcIIc6m5QGxu4GaG3xgWodYU9luzHh5QjHc6P3vxfVrVquZC','127.0.0.1','curl/8.7.1',1773721064116,1773721064116,1773749864115,0,NULL);
INSERT INTO UserSession VALUES('cmmu3q8g20009rqzhipwinyrr','cmmnqsfl8000003yp8yo84l46','vkhs9pOfsnMfvs4HCUhFRz5qGiaxvT15d47GfdRbiYDcjj4p','127.0.0.1','curl/8.7.1',1773721069635,1773721069635,1773749869634,0,NULL);
INSERT INTO UserSession VALUES('cmmu3rc4q000crqzht02ysymi','cmmnqsfl8000003yp8yo84l46','q2BN5DvOjZpQ3nIlWdZQrxEbno7o0MWQjhdMOkhDX6bXLTFx','127.0.0.1','curl/8.7.1',1773721121067,1773721121067,1773749921066,0,NULL);
INSERT INTO UserSession VALUES('cmmu3td5m003vrqzhzz49i1e0','cmmnqsfl8000003yp8yo84l46','qDMlNZ04osg9zTu7B7L7lmMwyAtvccPXqE6gx1pIPN8zxk9k','127.0.0.1','curl/8.7.1',1773721215706,1773721215706,1773750015705,0,NULL);
INSERT INTO UserSession VALUES('cmmu3u2my0040rqzhyinka9va','cmmnqsfl8000003yp8yo84l46','7gIC1whkRT94kB4U2hOcnIR5av3YTgW8BOpFgbp1F42KXnyR','127.0.0.1','curl/8.7.1',1773721248730,1773721248730,1773750048729,0,NULL);
INSERT INTO UserSession VALUES('cmmu3z2s70000rqpnus6y6epb','cmmnqsfl8000003yp8yo84l46','Y5SldJfMaIbVO67F6DkGmbetTUoQmP2tFYAeh2sf4miafB8h','127.0.0.1','curl/8.7.1',1773721482200,1773721482200,1773750282199,0,NULL);
INSERT INTO UserSession VALUES('cmmu3zck10005rqpnuywslbkb','cmmnqsfl8000003yp8yo84l46','zfrTR8BUJc46hfk0tuqjGKdcyUFVraevvYvI9Dkmd9brcUG5','127.0.0.1','curl/8.7.1',1773721494866,1773721494866,1773750294865,0,NULL);
INSERT INTO UserSession VALUES('cmmu427sc000arqpniuba41gt','cmmnqsfl8000003yp8yo84l46','S7RgF75eSsFkorHJCsqRDqOm89j75Bpcv6WOn5f91qn5VKqD','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',1773721628653,1773721628653,1773750428652,0,NULL);
INSERT INTO UserSession VALUES('cmmu476a30000rqeaw9rm9mny','cmmnqsfl8000003yp8yo84l46','igvvLzHzQb3ZCZrSLhsYM0nTX9N8NvMEnhMYllpf0RuCznIM','127.0.0.1','curl/8.7.1',1773721859979,1773721859979,1773750659978,0,NULL);
INSERT INTO UserSession VALUES('cmmu4dmkx0001rql1w7h2dzkj','cmmnqsfl8000003yp8yo84l46','ixm30jwJTPgMmpEHzgkGborOIOExRHMsBoWzAIZizen30imu','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722161042,1773722161042,1773750961041,0,NULL);
INSERT INTO UserSession VALUES('cmmu4dml20002rql108oxu0xk','cmmnqsfl8000003yp8yo84l46','eUwtp1AZkbixv5opAC18jGABpWyRUMNJZp3LjjkpuGXWKxyM','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722161047,1773722161047,1773750961046,0,NULL);
INSERT INTO UserSession VALUES('cmmu4dml50003rql1gx4cnh11','cmmnqsfl8000003yp8yo84l46','CMws252tGsnV79fvjYdVNnJz8dj0wCycAmDd6Gu4iiilQphM','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722161050,1773722161050,1773750961049,0,NULL);
INSERT INTO UserSession VALUES('cmmu4dmkw0000rql1da7en92n','cmmnqsfl8000003yp8yo84l46','FDIxg821HPUPDuyV4fXb2UJhQinrPkqaHn9S2FdRMWPgClSu','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722161040,1773722161040,1773750961039,0,NULL);
INSERT INTO UserSession VALUES('cmmu4dyui000krql1y4ghgwph','cmmnqsfl8000003yp8yo84l46','WcnTnVOgQHSLOTe5ctpVCq78rd5kTFzpMkiDVVGAdKEVsJoc','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722176939,1773722176939,1773750976938,0,NULL);
INSERT INTO UserSession VALUES('cmmu4dyvn000lrql1d3awyxv1','cmmnqsfl8000003yp8yo84l46','WxTrXBM8Br6tX0G65NletnaAqqlML0OwBekbOQLj1Xfmtzb5','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722176979,1773722176979,1773750976968,0,NULL);
INSERT INTO UserSession VALUES('cmmu4dz7q000urql1fpyhlxjz','cmmnqsfl8000003yp8yo84l46','Ju8R5DyxyiIHlAxkSgwFcari1WoL7bFFi2y34ZFQwSOHyCap','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722177414,1773722177414,1773750977411,0,NULL);
INSERT INTO UserSession VALUES('cmmu4dzkh000zrql1dlv77j0h','cmmnqsfl8000003yp8yo84l46','OU2JwZgS9UMWhYT2OwAA5Q5ONOodN5O9jvjn5amtzL7s18fV','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722177873,1773722177873,1773750977872,0,NULL);
INSERT INTO UserSession VALUES('cmmu4e4ms0014rql1fo5yj9z7','cmmnqsfl8000003yp8yo84l46','CqyqpXAuqYoB0ThjLP2XldKDp7CodzDLlsdq7HVONlXdNUGs','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722184436,1773722184436,1773750984435,0,NULL);
INSERT INTO UserSession VALUES('cmmu4e4mx0019rql1u8820s26','cmmnqsfl8000003yp8yo84l46','H7YIR6aGRiOfPXjj5KxrRZ3dbJNOoEsyWclNffx0hQOf6UBE','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722184441,1773722184441,1773750984440,0,NULL);
INSERT INTO UserSession VALUES('cmmu4e6eo001erql1mjnw5zd4','cmmnqsfl8000003yp8yo84l46','LnYHjvPxYkcCH6o5XJb2cvqZ2B6Z4GakoluUbLvEZbj6yFaG','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722186736,1773722186736,1773750986736,0,NULL);
INSERT INTO UserSession VALUES('cmmu4e6x5001jrql1z0p1k28p','cmmnqsfl8000003yp8yo84l46','BigYIk4q9QB446UuNK3DzEn4ZTH8wq3mZBPpffqBvxIiSAnZ','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722187402,1773722187402,1773750987401,0,NULL);
INSERT INTO UserSession VALUES('cmmu4ebr4001orql16agtkx6b','cmmnqsfl8000003yp8yo84l46','jdDApXTUpcVykIyA1YokG4T8CZfQtpt2jUBkJDWSBJWAdW8w','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722193664,1773722193664,1773750993664,0,NULL);
INSERT INTO UserSession VALUES('cmmu4ebrg001trql157dba1pj','cmmnqsfl8000003yp8yo84l46','2LiOoukJMKYxl9I5Vyu7ykXQZtzVgmTyZgmaDm9I12OS2eNh','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722193676,1773722193676,1773750993675,0,NULL);
INSERT INTO UserSession VALUES('cmmu4edni001yrql1ziz7b5u9','cmmnqsfl8000003yp8yo84l46','7HjQuRIDaQl0yqGffn30gFRAmbxbXc58VYPt1OT4HpoFFZLe','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722196127,1773722196127,1773750996126,0,NULL);
INSERT INTO UserSession VALUES('cmmu4ee3t0023rql1bmr799ah','cmmnqsfl8000003yp8yo84l46','REhv5bUtFLHKkn9LZzFGppSKAgYMX2PPQeBVhvgDbY8yhf95','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722196714,1773722196714,1773750996713,0,NULL);
INSERT INTO UserSession VALUES('cmmu4ev6v0029rql1f2tkwnvl','cmmnqsfl8000003yp8yo84l46','cMqVQoqIYndw8zqLACpikGuYLBVVSiXOE8Kj7zqBUhWTN1e9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722218856,1773722218856,1773751018854,0,NULL);
INSERT INTO UserSession VALUES('cmmu4ev6v0028rql1cqvks63t','cmmnqsfl8000003yp8yo84l46','cxhyLqidCWLRl9xr10xxbJOKSESvqNYa5pfEGVYu7HCik2OH','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722218856,1773722218856,1773751018854,0,NULL);
INSERT INTO UserSession VALUES('cmmu4g3a6002jrql18q5t8z2a','cmmnqsfl8000003yp8yo84l46','Ozta1jCdkqLHrEO2gCeIfPGpWvTUqt72nP8mLZWBBEwW0DrM','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722275998,1773722275998,1773751075998,0,NULL);
INSERT INTO UserSession VALUES('cmmu4g3aa002krql1wrtl89ip','cmmnqsfl8000003yp8yo84l46','T25B6goYxLARnZnEaZLWWxmG8MEHslKlbSBgGd5NA8khtTfd','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722276002,1773722276002,1773751076000,0,NULL);
INSERT INTO UserSession VALUES('cmmu4g3a5002irql170a4bl0v','cmmnqsfl8000003yp8yo84l46','ogluiqLPa7FutfZdu1q7FI4VTOX41hTJKEBKLSc6opxNO3u7','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722275997,1773722275997,1773751075996,0,NULL);
INSERT INTO UserSession VALUES('cmmu4g3bs002vrql1ssf6kop1','cmmnqsfl8000003yp8yo84l46','CZXKZA0b7YB0FuqXoJo5VF2BThaPbrMVvfIuDLetI5FSnI2b','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722276057,1773722276057,1773751076052,0,NULL);
INSERT INTO UserSession VALUES('cmmu4g9po0032rql10wq84pp5','cmmnqsfl8000003yp8yo84l46','3igcKybxeaInc0FOcyFpziFVGk1rsif44iipjuk5DEG3vRvW','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722284333,1773722284333,1773751084331,0,NULL);
INSERT INTO UserSession VALUES('cmmu4gdos0037rql10tdb42q7','cmmnqsfl8000003yp8yo84l46','xC2XT8QNSbVPFmjmzWMADZAwYBGl8d0f0Oy6dMuuZUytYQTb','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722289485,1773722289485,1773751089480,0,NULL);
INSERT INTO UserSession VALUES('cmmu4geau003crql1y0r0a8kg','cmmnqsfl8000003yp8yo84l46','ERNGXOwGfEOmb8XSaK5BnQBd8QOGfvRstqYZ41WNKkr0FNg5','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722290278,1773722290278,1773751090270,0,NULL);
INSERT INTO UserSession VALUES('cmmu4gfek003hrql10y991rd6','cmmnqsfl8000003yp8yo84l46','TpyMER0DRTuIlFnDXTMz6uq2FHdBXDMgDEJKlkiwc4JIDOp6','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722291708,1773722291708,1773751091708,0,NULL);
INSERT INTO UserSession VALUES('cmmu4gh17003mrql18d6lomhp','cmmnqsfl8000003yp8yo84l46','cEkyJfPdiyDDUmAe8p8KMXgm87GyZuD8Vr82ihyfU3ea068t','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722293819,1773722293819,1773751093818,0,NULL);
INSERT INTO UserSession VALUES('cmmu4gig9003rrql185irow55','cmmnqsfl8000003yp8yo84l46','b05YmW8FiLCp275nNquIVlxY9QqHF43xBDo1BbK82RYGw4cu','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722295657,1773722295657,1773751095657,0,NULL);
INSERT INTO UserSession VALUES('cmmu4glu3003wrql1tchn5nvo','cmmnqsfl8000003yp8yo84l46','ZMI7afnPAmoPX1MuV5CHbgLaiX3jSw97NMP7qSIUmHpXmuHH','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722300043,1773722300043,1773751100031,0,NULL);
INSERT INTO UserSession VALUES('cmmu4gn780041rql17h7dn2t2','cmmnqsfl8000003yp8yo84l46','gghflmJ8Fxit5AD0rwJ7tHnjJI0WB1lJuZivfbpRwzEqc3Pn','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722301812,1773722301812,1773751101812,0,NULL);
INSERT INTO UserSession VALUES('cmmu4i0xa0046rql1ds9jmmrp','cmmnqsfl8000003yp8yo84l46','8GN9TKsORHjs9Zq6DizJYterC982e1R0H0RKV3SFMpIqd8ts','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722366254,1773722366254,1773751166254,0,NULL);
INSERT INTO UserSession VALUES('cmmu4i1g8004brql1bb2a4zda','cmmnqsfl8000003yp8yo84l46','7TJScjW7e3NzEQ5xuDCtL49L81bi7kQ9ra5tN3fpM17scklw','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722366937,1773722366937,1773751166936,0,NULL);
INSERT INTO UserSession VALUES('cmmu4i27f004grql1ed64tbh5','cmmnqsfld000103yp3d86suci','TVXJIDT8EyAl38WKdxvkkDaeVpQAXK4txVe03UE1JEOF7E6X','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722367915,1773722367915,1773751167914,0,NULL);
INSERT INTO UserSession VALUES('cmmu4i54n004lrql1vq3yk2au','cmmnqsfl8000003yp8yo84l46','zDBh3vVBNueZxEYluNmATFUPqbR7UI2IIkbQ87hgOQeq7et2','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722371703,1773722371703,1773751171703,0,NULL);
INSERT INTO UserSession VALUES('cmmu4iaj7004qrql11zyrs0jh','cmmnqsfl8000003yp8yo84l46','WqqH9QysJWqSXYwe9EQGj7M9CihnEFDlDquIv0HUpsxDE1KA','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722378707,1773722378707,1773751178707,0,NULL);
INSERT INTO UserSession VALUES('cmmu4ifyv004vrql1jebcltvd','cmmnqsfl8000003yp8yo84l46','enwgwaVWU9OpWQDiyWCQ6Bgqsfoly0Fh1JIuqJZ6rYJKfbwH','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722385752,1773722385752,1773751185751,0,NULL);
INSERT INTO UserSession VALUES('cmmu4ileo0050rql18pasfygm','cmmnqsfl8000003yp8yo84l46','Ao7z1QqC4OdAN7kce8VOghPY9FYmC2HnkUrJYsHWdk1z6bYZ','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722392801,1773722392801,1773751192800,0,NULL);
INSERT INTO UserSession VALUES('cmmu4iqug0055rql1rgoxapfq','cmmnqsfl8000003yp8yo84l46','Efuf0jQMVFkc8ZXRhzmuhxrCj27TkanWCvpKQvWLujZrmMak','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722399848,1773722399848,1773751199847,0,NULL);
INSERT INTO UserSession VALUES('cmmu4iw9b005arql1ijkk8k2i','cmmnqsfl8000003yp8yo84l46','3nnh3HGuAHsnxKsKDBnsuWqjp2R0rzxDpVzaSPmy6LwEmorY','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722406863,1773722406863,1773751206862,0,NULL);
INSERT INTO UserSession VALUES('cmmu4j1wn005frql1u3ib8zik','cmmnqsfl8000003yp8yo84l46','m36RBZe19VNo6sPzquXGGQ5ZiR4osL8pwiweAMiDTBy9yi2T','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722414183,1773722414183,1773751214183,0,NULL);
INSERT INTO UserSession VALUES('cmmu4j7oj005krql1nke2ljcm','cmmnqsfl8000003yp8yo84l46','C8jDl1X203i2eVTl7OC1OI4gs0IJtglFSqMqLMBQtbwr05rm','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722421668,1773722421668,1773751221667,0,NULL);
INSERT INTO UserSession VALUES('cmmu4jl28005prql15e39txbf','cmmnqsfl8000003yp8yo84l46','aFZ8QGYaxABRXXaT7nr5TzZEvXLjtKJY2bSDtLvMHUnOm79q','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722439008,1773722439008,1773751239008,0,NULL);
INSERT INTO UserSession VALUES('cmmu4jqg6005urql1p6f4ep8l','cmmnqsfl8000003yp8yo84l46','CjbqBpIlP5dLE8bmPskz46tUZPh9bzM18hOdNettAXwpCdor','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722445991,1773722445991,1773751245990,0,NULL);
INSERT INTO UserSession VALUES('cmmu4jvu2005zrql1k8ptjjqc','cmmnqsfl8000003yp8yo84l46','WsCv7EPQDavg4JIP5DZFAqaAmsdXc5XgZSsSQLcPSBZYwvqy','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722452971,1773722452971,1773751252970,0,NULL);
INSERT INTO UserSession VALUES('cmmu4k1gc0064rql135eqdmf3','cmmnqsfl8000003yp8yo84l46','KEmhZKCWX496HTsJ98BkAHYjRoU0ymzYqk9vxB5w3SB8sGQI','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722460252,1773722460252,1773751260252,0,NULL);
INSERT INTO UserSession VALUES('cmmu4k6xi0069rql1bj8nwq9r','cmmnqsfl8000003yp8yo84l46','GvNC9PzwSdxKPDKi0paL1gsmcxB4eg3Dkr5TMSO5qoXaKO5n','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722467350,1773722467350,1773751267350,0,NULL);
INSERT INTO UserSession VALUES('cmmu4kcao006erql13gug92gi','cmmnqsfl8000003yp8yo84l46','jwRnHEPUMbbSR3Tzkmztm4LWrRlMwXFPfsBu5LiOisL2p61o','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722474305,1773722474305,1773751274304,0,NULL);
INSERT INTO UserSession VALUES('cmmu4ki55006jrql1q9g2ej6h','cmmnqsfl8000003yp8yo84l46','Ux1QfG77iE01NuEJJk2fKazeGNGoAPbB4MMYoCHfMghBo5PD','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722481881,1773722481881,1773751281881,0,NULL);
INSERT INTO UserSession VALUES('cmmu4knm0006orql1a0lqthdl','cmmnqsfl8000003yp8yo84l46','MRjPLxuKW1fGGUWQYAfy0w5kzxgnNor2U8ekL2EXqbXjgnOK','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722488968,1773722488968,1773751288968,0,NULL);
INSERT INTO UserSession VALUES('cmmu4kt7i006trql1lncl7w8u','cmmnqsfl8000003yp8yo84l46','PLrO01fRddQAEEHkWOIb20pF3oJHYzT39q60NLOqU3Qc8CkE','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773722496223,1773722496223,1773751296222,0,NULL);
INSERT INTO UserSession VALUES('cmmu4pbqh006yrql1b76i6lyt','cmmnqsfl8000003yp8yo84l46','h4sXM09b2Xh1qRzCgxVTq5gM2dJ6oCCMHWg0ATZ2Wg007TK7','127.0.0.1','curl/8.7.1',1773722706857,1773722706857,1773751506857,0,NULL);
INSERT INTO UserSession VALUES('cmmu4vs2a0073rql14ie11ekc','cmmnqsfl8000003yp8yo84l46','qOhgkiJ0rxnMxXIgEwzNGOe5LIawl5BBDkclVLZOVzWnwTlc','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',1773723007955,1773723007955,1773751807954,0,NULL);
INSERT INTO UserSession VALUES('cmmu4x9ey0078rql1tow25hlm','cmmnqsfl8000003yp8yo84l46','fLyIq03P6d3bkNWrq69KgsM4NlrqlnsWRiFVwU5f6GIPgpcy','127.0.0.1','curl/8.7.1',1773723077098,1773723077098,1773751877097,0,NULL);
INSERT INTO UserSession VALUES('cmmu53xkc007drql1amgw0odk','cmmnqsfl8000003yp8yo84l46','dq9Ws0BA9NwcEn8wegARt94QXpHmoKYiyfIqmQQDBBj8TSPu','127.0.0.1','curl/8.7.1',1773723388332,1773723388332,1773752188332,0,NULL);
INSERT INTO UserSession VALUES('cmmu555vd007irql1wgrgzdxc','cmmnqsfl8000003yp8yo84l46','BQeyw8lNuiQC3xrhUm2XiO68soSwehK6VwxVVE8eQlNKTh9C','127.0.0.1','curl/8.7.1',1773723445753,1773723445753,1773752245753,0,NULL);
INSERT INTO UserSession VALUES('cmmu58dxq007nrql1idn2hfga','cmmnqsfl8000003yp8yo84l46','NNMr23WGx9QRXKvM2edUi1RbTuyG9vbblcrM0hAwzrIdlo6X','127.0.0.1','curl/8.7.1',1773723596175,1773723596175,1773752396174,0,NULL);
INSERT INTO UserSession VALUES('cmmu5ehfl0000rqcgu29fx9dy','cmmnqsfl8000003yp8yo84l46','2AycD0674bP3lJzq8RrKgwfxnXSDj9OXk4LSYzieygxtddtc','127.0.0.1','curl/8.7.1',1773723880641,1773723880641,1773752680641,0,NULL);
INSERT INTO UserSession VALUES('cmmu7120s0005rqcgkkjtxcfg','cmmnqsfl8000003yp8yo84l46','jEYi0CjbiopC3G0tZHj7M5gRjZDTGMtpsoIJdtKYrWjSPfjn','127.0.0.1','curl/8.7.1',1773726613373,1773726613373,1773755413372,0,NULL);
INSERT INTO UserSession VALUES('cmmu72qb3000arqcga55m8ia9','cmmnqsfl8000003yp8yo84l46','iO4SeRvQwcxxTitL9hWbJ0dUqi5IWmpRtzwIHwXXuNiKCzgJ','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726691503,1773726691503,1773755491502,0,NULL);
INSERT INTO UserSession VALUES('cmmu72qbk000frqcgqzr0ny0d','cmmnqsfl8000003yp8yo84l46','BU0qjai0cRwPnLuDTUGIusBKzPaINk5WvmgEn0d1ymogNQYX','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726691520,1773726691520,1773755491519,0,NULL);
INSERT INTO UserSession VALUES('cmmu72qcm000krqcglekgxvy8','cmmnqsfl8000003yp8yo84l46','OpAZEx30OIhe6SJVX1dit77KZIaJ1G3Z7FLAclc2wQSjRyi1','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726691559,1773726691559,1773755491558,0,NULL);
INSERT INTO UserSession VALUES('cmmu72qhm000nrqcg81ijri8j','cmmnqsfl8000003yp8yo84l46','48TnWw2G0oPtrLEPLO0Y0UxrTL5iNgIByulbZudQLzOU1RKF','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726691739,1773726691739,1773755491736,0,NULL);
INSERT INTO UserSession VALUES('cmmu72qm5000urqcgkuwicuud','cmmnqsfl8000003yp8yo84l46','xi3xGLSjo2yp2SxNYidiEyP6qGdMLw39ySNS5oFmKqYlwSDA','127.0.0.1','curl/8.7.1',1773726691902,1773726691902,1773755491888,0,NULL);
INSERT INTO UserSession VALUES('cmmu72wj1000zrqcgccz1jsgc','cmmnqsfl8000003yp8yo84l46','iQlfS2P4gwOLDQgrKrME210gyjTM6Vbu5IYHRIHvKkRmDDpC','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726699566,1773726699566,1773755499561,0,NULL);
INSERT INTO UserSession VALUES('cmmu72wkl0012rqcg82rloz7w','cmmnqsfl8000003yp8yo84l46','3VJWoIMgPhGPD3QlaguJJeqdgFnq5yaeZdPW0ifnJS1MbKN1','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726699621,1773726699621,1773755499620,0,NULL);
INSERT INTO UserSession VALUES('cmmu731z5001arqcgkad3f1xa','cmmnqsfl8000003yp8yo84l46','TepScglhJHAoiPj32MJ3hhCFO6NdUruhdjHtWcPOILM7qQp7','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726706625,1773726706625,1773755506624,0,NULL);
INSERT INTO UserSession VALUES('cmmu731z10019rqcgnc8573rr','cmmnqsfl8000003yp8yo84l46','xJbzVhGy0hLSjzIK9ih6lxVDTffgDfzGX9DeisLrHFDUzy5S','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726706622,1773726706622,1773755506621,0,NULL);
INSERT INTO UserSession VALUES('cmmu735n2001jrqcgejszrqbb','cmmnqsfl8000003yp8yo84l46','u6iwMbMRFnEu8h5Uf8hpoTQgRS6jz4uHMPokZCla21jILN73','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726711374,1773726711374,1773755511373,0,NULL);
INSERT INTO UserSession VALUES('cmmu735n7001krqcge387how1','cmmnqsfl8000003yp8yo84l46','d9E4lZHp5nCWAMzgwttbThGmpqNofQeJ86YngJg7j8rMupKw','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726711379,1773726711379,1773755511378,0,NULL);
INSERT INTO UserSession VALUES('cmmu738n7001trqcgln1ms9yj','cmmnqsfl8000003yp8yo84l46','OkhvjdDMOKJFkWLyx5pp3Rg4UFy2DhOzDvJ0rrSiYMtM02rR','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726715268,1773726715268,1773755515267,0,NULL);
INSERT INTO UserSession VALUES('cmmu73aqf001yrqcgiqx0uzz0','cmmnqsfl8000003yp8yo84l46','wa1Gq2QQ4ABY6LmcPrLCaGL1cpf0wSxjcBmtd99dfnkS2Zr3','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726717975,1773726717975,1773755517973,0,NULL);
INSERT INTO UserSession VALUES('cmmu740h20023rqcg6wuauhj8','cmmnqsfl8000003yp8yo84l46','SbzvL4oYxlyMiwcLz9dxO8rVuP8ckySSszFPqTH4fSHRcC1r','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726751335,1773726751335,1773755551334,0,NULL);
INSERT INTO UserSession VALUES('cmmu740lh0024rqcghi3nfod1','cmmnqsfl8000003yp8yo84l46','KrpAj7i2DSh92Nzo9RjKP3ujZQ141Rz9IIxH36hX2GOdGYwJ','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726751494,1773726751494,1773755551491,0,NULL);
INSERT INTO UserSession VALUES('cmmu740n00029rqcg8yzn8ul0','cmmnqsfl8000003yp8yo84l46','DcxmzBHXTHbNMFBwzWaO7yLXrhgvISRC4cEhTLs6VYxI9BHg','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726751549,1773726751549,1773755551548,0,NULL);
INSERT INTO UserSession VALUES('cmmu7413b002irqcgs9asaq25','cmmnqsfl8000003yp8yo84l46','fO80cfzdcsh1wM15qS0cy6kE4vow3FtMS1sPDJtqKHBp3LyP','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726752136,1773726752136,1773755552135,0,NULL);
INSERT INTO UserSession VALUES('cmmu744ui002nrqcgyanae7yx','cmmnqsfl8000003yp8yo84l46','iQbXn1od3EjxXJFWYnn9CjPeE0ScIzA9uHl7BUWod9cep4gQ','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726757003,1773726757003,1773755557002,0,NULL);
INSERT INTO UserSession VALUES('cmmu745ld002srqcgbbakfte5','cmmnqsfl8000003yp8yo84l46','Ncv3nbPAUIRkhm3xpLZ8k8HECzzldYnfEs3buzSCE5FgptUb','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726757969,1773726757969,1773755557969,0,NULL);
INSERT INTO UserSession VALUES('cmmu746hw002xrqcg3uibdq5r','cmmnqsfl8000003yp8yo84l46','NJ6cmQLhNCKcF190YIvitIrEOvAOsMlSTfFMucQ0sK0IkqR7','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726759140,1773726759140,1773755559140,0,NULL);
INSERT INTO UserSession VALUES('cmmu7499x0032rqcgvpwslyqu','cmmnqsfl8000003yp8yo84l46','l66ZO41acVV7FpdmtTI00hcfNQnqIqRI9vuBYaZFOz1AyEni','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726762741,1773726762741,1773755562740,0,NULL);
INSERT INTO UserSession VALUES('cmmu74a5e0037rqcgixalrhz2','cmmnqsfl8000003yp8yo84l46','zTgHWSbLtTcL09uM9Qt64XbJ56ar4YkiPZ2mpOB1DmmmZFSx','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726763874,1773726763874,1773755563873,0,NULL);
INSERT INTO UserSession VALUES('cmmu74bdl003crqcgoa1brdfj','cmmnqsfl8000003yp8yo84l46','1Mm96cv49hJkppMEfkzmVawXFQEtHE7DOVrWOeoB1Uq7gXAB','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726765465,1773726765465,1773755565464,0,NULL);
INSERT INTO UserSession VALUES('cmmu74dmy003hrqcg9h5q4rp1','cmmnqsfl8000003yp8yo84l46','NQKd9ruTg7jCY64gYxFe1Sc2JLIYUm6buIipuqA3XSqomBUz','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726768395,1773726768395,1773755568393,0,NULL);
INSERT INTO UserSession VALUES('cmmu74f07003mrqcgkwd105uf','cmmnqsfl8000003yp8yo84l46','OWfxohAgpRt2UIC0znE2Y1d1e6WNm5iW6NErVRToOsXCNRo1','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726770168,1773726770168,1773755570167,0,NULL);
INSERT INTO UserSession VALUES('cmmu74gvo003rrqcg7hft5sxj','cmmnqsfl8000003yp8yo84l46','CN9fcaW88kLPpsSYmDOOxTNwPT6NplG1a0uuaYRlLhMdUzrZ','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726772597,1773726772597,1773755572596,0,NULL);
INSERT INTO UserSession VALUES('cmmu74jrq003wrqcgxfdlmgr1','cmmnqsfl8000003yp8yo84l46','nW3jhD1DntmCDg0ukvKHgmu1JRpbqIRc8SDCvMDsM8TVFlQo','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726776342,1773726776342,1773755576341,0,NULL);
INSERT INTO UserSession VALUES('cmmu75s960041rqcg2qom7sax','cmmnqsfl8000003yp8yo84l46','TRlDMvNuWvHBn2bv8Wzyfg580vI5Ri1ZbvxF6Z8KF1SKJJLb','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726833993,1773726833993,1773755633985,0,NULL);
INSERT INTO UserSession VALUES('cmmu766dh0046rqcgfwarz7ui','cmmnqsfl8000003yp8yo84l46','wUYQrbZZRRR02gMeMSnLbfGM8uRM491akp6KqjCigZvDUJsJ','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726852293,1773726852293,1773755652292,0,NULL);
INSERT INTO UserSession VALUES('cmmu766dm0047rqcgmg8osnrn','cmmnqsfl8000003yp8yo84l46','LodUpEpHnX2z63jezgG6NwXsne6sFsuf6rwNHEPfyVkCYgk7','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726852298,1773726852298,1773755652296,0,NULL);
INSERT INTO UserSession VALUES('cmmu766dy004arqcggqtp2vdc','cmmnqsfl8000003yp8yo84l46','aY9r4tyqc9QEUp1GOdyDaMRY9x1Wlm80twPXbQwMx7yOmeb5','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726852311,1773726852311,1773755652310,0,NULL);
INSERT INTO UserSession VALUES('cmmu766g9004lrqcg7w1znjom','cmmnqsfl8000003yp8yo84l46','cyYK9n5F8dp33qJc1soR45QXBGGlHRUxp7kXMmrsgNIeASU5','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726852393,1773726852393,1773755652388,0,NULL);
INSERT INTO UserSession VALUES('cmmu76czx004qrqcgqne81kg3','cmmnqsfl8000003yp8yo84l46','UFz90E5IzlQqb8Btsf4C0yH0as2OeZXL738mXasY8JV7RHWj','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726860877,1773726860877,1773755660877,0,NULL);
INSERT INTO UserSession VALUES('cmmu76d0f004rrqcg1kdcwz8r','cmmnqsfl8000003yp8yo84l46','T1OXZpOMbOHTjg55RQWiYDi9LmSOAQAR9ldL83Jb85F6KyQz','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726860895,1773726860895,1773755660894,0,NULL);
INSERT INTO UserSession VALUES('cmmu76ie80050rqcgxoxu3ol1','cmmnqsfl8000003yp8yo84l46','6ohboMT10FQ73zxGt69V4JcIa55K1ElD25rdtalDUbPqh2qs','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726867872,1773726867872,1773755667871,0,NULL);
INSERT INTO UserSession VALUES('cmmu76ief0053rqcgvuyowv2r','cmmnqsfl8000003yp8yo84l46','F0mAkJixavQRIs5QgE9d7madhTsg0Y3a8BPamtcYrT568S0c','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726867880,1773726867880,1773755667879,0,NULL);
INSERT INTO UserSession VALUES('cmmu76kva005arqcgkonqyi2y','cmmnqsfl8000003yp8yo84l46','3gafpr0wat2Pp1nN3VjhyoT6Ke7vfkwGPjyZ7EtP5kSAOVRE','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726871078,1773726871078,1773755671077,0,NULL);
INSERT INTO UserSession VALUES('cmmu76m0g005frqcgo575l6qt','cmmnqsfl8000003yp8yo84l46','FXJRWHPjkBphiWtFPBnvzy98oKQZnhC2RmOnoGMfbjEHUw9u','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726872560,1773726872560,1773755672560,0,NULL);
INSERT INTO UserSession VALUES('cmmu76p4s005krqcgrapv3zrs','cmmnqsfl8000003yp8yo84l46','PHpdk1V9RDGcc5EoioiPVI5kjUCLIgb8Tsp8wIZUXdypoNV9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726876604,1773726876604,1773755676603,0,NULL);
INSERT INTO UserSession VALUES('cmmu76pgv005prqcgsovx8up3','cmmnqsfl8000003yp8yo84l46','nNGwBwrF1pzk5aWb4jDhEHcl80dxeBD8s2z7SC7qDuyjWTZR','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726877039,1773726877039,1773755677038,0,NULL);
INSERT INTO UserSession VALUES('cmmu78p7r005urqcgoqg4pbg7','cmmnqsfl8000003yp8yo84l46','4kpk5BbWvigS0k0eW0lCZQjrT5Jc3D9Qikw79T0eXIVyULSJ','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726970023,1773726970023,1773755770023,0,NULL);
INSERT INTO UserSession VALUES('cmmu78qu40060rqcgvy8nkn46','cmmnqsfl8000003yp8yo84l46','M0Y0zBremYGqV9eij4ldY96voG74ecnGYMSfRIP4I6PJOnVY','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726972125,1773726972125,1773755772123,0,NULL);
INSERT INTO UserSession VALUES('cmmu78qtu005zrqcgmh1s7hr6','cmmnqsfl8000003yp8yo84l46','dKhxmEmfExYcj3zxgNl1gbwL0RF1NUnbCeH9n58yIoPIhxxk','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726972115,1773726972115,1773755772114,0,NULL);
INSERT INTO UserSession VALUES('cmmu78qyf0069rqcgnkgv87cm','cmmnqsfl8000003yp8yo84l46','sjdAvKyNBZSGYkXV9gC8xrHttUVvshbf14vSWwFaaCh2peHg','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726972279,1773726972279,1773755772250,0,NULL);
INSERT INTO UserSession VALUES('cmmu78uee006erqcglfb0g3m5','cmmnqsfl8000003yp8yo84l46','4eTIfenkmUbVzBhU7MVYLwszIJi4UhwBacV2jl8d8cMNJqFE','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726976742,1773726976742,1773755776741,0,NULL);
INSERT INTO UserSession VALUES('cmmu78v9m006jrqcgjqiukhw6','cmmnqsfl8000003yp8yo84l46','zA7XCZgsdHX5rKjcIATvIQeM4bmPC6acl0QiroOyLlQKG1Bq','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726977867,1773726977867,1773755777866,0,NULL);
INSERT INTO UserSession VALUES('cmmu78y69006orqcgx7oincp7','cmmnqsfl8000003yp8yo84l46','BnUMCtNMQN4VfFmduplMX0OEKlIbvD5Obh5fcA93ROXdq5pb','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726981633,1773726981633,1773755781632,0,NULL);
INSERT INTO UserSession VALUES('cmmu790n4006trqcg83ffke75','cmmnqsfl8000003yp8yo84l46','WAZuFcSrtOV7BRBoCV6sNfx39FuWgJUy8CnYGaYYpViW2j8U','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726984833,1773726984833,1773755784832,0,NULL);
INSERT INTO UserSession VALUES('cmmu7915a006yrqcg2khcopbb','cmmnqsfl8000003yp8yo84l46','jAhKgDkvfOdfkTeNG34VzqOt1J84jxFCDQWgTkOat4c3BS0p','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726985487,1773726985487,1773755785480,0,NULL);
INSERT INTO UserSession VALUES('cmmu792zn0073rqcgb1mmcds2','cmmnqsfl8000003yp8yo84l46','6lpzu3kfAcvXHXKzwkaEuSEdnIocJg6DS0Mhj1YdMvIm1ahk','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726987875,1773726987875,1773755787874,0,NULL);
INSERT INTO UserSession VALUES('cmmu794wz0078rqcg3k64c5n8','cmmnqsfl8000003yp8yo84l46','DmnbTHLgCcuYhWcndA92vGdS4EPVKGOsAlxNS1aN1GUGyElF','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726990371,1773726990371,1773755790370,0,NULL);
INSERT INTO UserSession VALUES('cmmu7970w007drqcg4xhna44t','cmmnqsfl8000003yp8yo84l46','OYaoy4wNTUyTDdLYrf1e0sIrhJJrPjWp35MpmLXsOXXh1DeG','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726993104,1773726993104,1773755793103,0,NULL);
INSERT INTO UserSession VALUES('cmmu7971k007irqcgqwakodid','cmmnqsfl8000003yp8yo84l46','8V22ylCzwxOw1GFcDE1yCbtjPufpVFikkOBg5oGDHTG4rEVl','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726993129,1773726993129,1773755793128,0,NULL);
INSERT INTO UserSession VALUES('cmmu799e4007nrqcgyrciolsn','cmmnqsfl8000003yp8yo84l46','X2IiTVrwK6H55N0ErbUcbYvgPCKMwRYgUbRplUC4Jm6ytMl3','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726996172,1773726996172,1773755796172,0,NULL);
INSERT INTO UserSession VALUES('cmmu79beb007srqcg0vfq2axk','cmmnqsfl8000003yp8yo84l46','wFVJ5dWsaVSounK3hlaAkG8uMY0l63BqYhblmalTc2qucuDg','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773726998772,1773726998772,1773755798771,0,NULL);
INSERT INTO UserSession VALUES('cmmu79dfb007xrqcgri24nltx','cmmnqsfl8000003yp8yo84l46','Ke9QDWYfeIY7MzZvo1ef8mv7fnqpCb3ZjWKl3Sa4MzM3dnJ6','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727001400,1773727001400,1773755801396,0,NULL);
INSERT INTO UserSession VALUES('cmmu79ef50082rqcg3kzxtn6j','cmmnqsfl8000003yp8yo84l46','bNQBognX1mj7U6oEmQkRW3cu1V3Ez944WtB6W4fTCJOTnW8F','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727002690,1773727002690,1773755802688,0,NULL);
INSERT INTO UserSession VALUES('cmmu79h020087rqcg4uygjwou','cmmnqsfl8000003yp8yo84l46','y3lV4eSAYTY7pcFnUo7A4lXm8GMIsaWB2zyhDL2dU1OBJ6oe','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727006034,1773727006034,1773755806034,0,NULL);
INSERT INTO UserSession VALUES('cmmu79irl008crqcg7zzvheqs','cmmnqsfl8000003yp8yo84l46','VCJhcErJCcb4AmjEIMa5782eCLdJ1M7btLk6OP0XASHY0I9t','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727008321,1773727008321,1773755808317,0,NULL);
INSERT INTO UserSession VALUES('cmmu79lgv008hrqcglru1fm3a','cmmnqsfl8000003yp8yo84l46','u6rTseGugRGSlbF5ILTI4T4aQAa75I5alcpKRY5J9k5If71V','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727011823,1773727011823,1773755811822,0,NULL);
INSERT INTO UserSession VALUES('cmmu79nm3008mrqcgoq9t4057','cmmnqsfl8000003yp8yo84l46','xNIRhJr7Hdz7D8eEOFyMsqF5anrnwso127ej5TXR5rT7TBhC','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727014603,1773727014603,1773755814596,0,NULL);
INSERT INTO UserSession VALUES('cmmu7ahmz008rrqcgxqo7brpm','cmmnqsfl8000003yp8yo84l46','elJf1X0TZUa51TpSFpkxFUORNykhTjqqfZmyf4hoDTfBQTdI','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727053514,1773727053514,1773755853508,0,NULL);
INSERT INTO UserSession VALUES('cmmu7aiqo008wrqcg24gcivio','cmmnqsfl8000003yp8yo84l46','zMopEjbSvh8eHjgv93eNNLD7VrpZ8oQLBidgWrS4C1o5XMUF','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727054945,1773727054945,1773755854936,0,NULL);
INSERT INTO UserSession VALUES('cmmu7ameb0091rqcgpyrvnf40','cmmnqsfl8000003yp8yo84l46','oDr4wkGh1SpbRbNIczJwgrgPyFADKo8DhFl4Iv5WVrfSfOXr','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727059684,1773727059684,1773755859683,0,NULL);
INSERT INTO UserSession VALUES('cmmu7ao530096rqcg2tx0pxlc','cmmnqsfl8000003yp8yo84l46','UAVhx83dQb2yrZjpH7r3dAJLwmho0qnM0G1TdntuaTQAYHAE','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727061944,1773727061944,1773755861928,0,NULL);
INSERT INTO UserSession VALUES('cmmu7ao5q0099rqcgccn5x3od','cmmnqsfl8000003yp8yo84l46','aYAzXDCBoHEbsKfRMZYLLtuo9m0U50JRvnV5eJKojeKgAuyo','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727061963,1773727061963,1773755861962,0,NULL);
INSERT INTO UserSession VALUES('cmmu7arwx009grqcgwu9yerj8','cmmnqsfl8000003yp8yo84l46','BIsHxshA2egyIGAQRUDqHIPryn69aQ7GywCwepe6iE1NTd61','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727066834,1773727066834,1773755866833,0,NULL);
INSERT INTO UserSession VALUES('cmmu7atdy009lrqcg5j5hhto8','cmmnqsfl8000003yp8yo84l46','iYsM0M1wNpHpjbg3O6oCyW15gs92Vw4kUwzMDsBvbuCPOhVZ','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727068742,1773727068742,1773755868737,0,NULL);
INSERT INTO UserSession VALUES('cmmu7aw6i009qrqcg14tclm96','cmmnqsfl8000003yp8yo84l46','Vl0WHV1dK2moezy2LUK1eCBnhQuN6VfmwmdmQMbrlUo1UbDX','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727072362,1773727072362,1773755872361,0,NULL);
INSERT INTO UserSession VALUES('cmmu7aw6k009rrqcgzjij0zqy','cmmnqsfl8000003yp8yo84l46','VI2qtqAIwheR70iqp678S28Ouz6O1dffS7RG7Tu5mPKvvLxH','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727072364,1773727072364,1773755872363,0,NULL);
INSERT INTO UserSession VALUES('cmmu7b0zr00a0rqcgb6f1weqs','cmmnqsfl8000003yp8yo84l46','ajay69k6HJ2fdPP8lHQnJRPYhDiEJa6BprwzJMow8GBrSjCk','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727078599,1773727078599,1773755878597,0,NULL);
INSERT INTO UserSession VALUES('cmmu7d51f00a5rqcgfomlc1ss','cmmnqsfl8000003yp8yo84l46','jrxdlG21n9AiCiA3PkuRY1g2UkYzfMgVndL22y5sApwq3IWo','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727177155,1773727177155,1773755977154,0,NULL);
INSERT INTO UserSession VALUES('cmmu7dcii00aarqcgfapgyk6w','cmmnqsfl8000003yp8yo84l46','oHvbfWjT31FAXBFZjJYprMc6XwTmoEqK1rhlOAvfte2PoLWc','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727186842,1773727186842,1773755986841,0,NULL);
INSERT INTO UserSession VALUES('cmmu7djs700afrqcgi1pyeqbe','cmmnqsfl8000003yp8yo84l46','hcmn9pV6MUeV9TShK9rcG0f6nTMLL1ncdeDIk8d3Csa0PPkN','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727196263,1773727196263,1773755996260,0,NULL);
INSERT INTO UserSession VALUES('cmmu7dw5600alrqcgi4r6k95q','cmmnqsfl8000003yp8yo84l46','kpQZWV9WBBEPXJCaSnIXnN3DPGJaQ2ew59jGTCSQtnVB8ZxO','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727212282,1773727212282,1773756012257,0,NULL);
INSERT INTO UserSession VALUES('cmmu7dw5500akrqcgrcxr0amj','cmmnqsfl8000003yp8yo84l46','87CmcbQthQTmEPTBSPVNKSchqqUGrx9E476RSC6LFexZqvkC','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727212278,1773727212278,1773756012257,0,NULL);
INSERT INTO UserSession VALUES('cmmu7dweq00amrqcgbtgym2n2','cmmnqsfl8000003yp8yo84l46','qUkDaMVdNzDkeZT1e4RYBVQMoQNxi6koESxXrg69QaqncWYh','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727212626,1773727212626,1773756012588,0,NULL);
INSERT INTO UserSession VALUES('cmmu7ejb300azrqcggi0b7oqa','cmmnqsfl8000003yp8yo84l46','8J2fI1oHMqAdHlWrzbebsFe1gBNbYODQnRFcTCUAwCx2kezu','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727242303,1773727242303,1773756042302,0,NULL);
INSERT INTO UserSession VALUES('cmmu7eji100b4rqcgy36my8gv','cmmnqsfl8000003yp8yo84l46','ceXdd811iHmYbve4ShVyVYpZAh1ZazZR6pXGNn6UPLSL5s1f','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727242553,1773727242553,1773756042552,0,NULL);
INSERT INTO UserSession VALUES('cmmu7elj800b9rqcgy07cne8r','cmmnqsfl8000003yp8yo84l46','OKdZdVlDeVFw9FVLnA7QiSTFua2q4HxEshIxWYgAma1hjMiw','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727245189,1773727245189,1773756045187,0,NULL);
INSERT INTO UserSession VALUES('cmmu7en7h00berqcgu2l22wf3','cmmnqsfl8000003yp8yo84l46','RLseG26ddVIQCz8INoatqFXK90XlC5WWkDak579NjjhSUTgk','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727247358,1773727247358,1773756047354,0,NULL);
INSERT INTO UserSession VALUES('cmmu7eoty00bjrqcgffaujru0','cmmnqsfl8000003yp8yo84l46','Wpk823QtB7oyIGZ70E5VO8Q1tRLydr6LEmTme0vxAvLw99Kt','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727249462,1773727249462,1773756049462,0,NULL);
INSERT INTO UserSession VALUES('cmmu7erwk00borqcgpg52to4j','cmmnqsfl8000003yp8yo84l46','2btl1iLaXBreHmGrQEK3OGUp0gzgq2gkQaYblzARXOQSF6zc','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727253445,1773727253445,1773756053442,0,NULL);
INSERT INTO UserSession VALUES('cmmu7exms00btrqcg75keqwwe','cmmnqsfl8000003yp8yo84l46','qi7DKYTWjPTwZgHKKnk6aanKfjsn4RMSQt8EamT5skNROatQ','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727260860,1773727260860,1773756060858,0,NULL);
INSERT INTO UserSession VALUES('cmmu7exng00burqcgj9eewpcy','cmmnqsfl8000003yp8yo84l46','8LB7799Dt8QneMRsCgJhGpcJ7N8s3f09NV9XqZCsf4bsKrwL','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727260893,1773727260893,1773756060888,0,NULL);
INSERT INTO UserSession VALUES('cmmu7f94j00c4rqcg3pwvujuv','cmmnqsfl8000003yp8yo84l46','Luwb7vyGDWOqqRsf45ec2LJ6GW6O56S7j7aVGfCpsCHlKyeU','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727275764,1773727275764,1773756075763,0,NULL);
INSERT INTO UserSession VALUES('cmmu7f94f00c3rqcg3uk8i305','cmmnqsfl8000003yp8yo84l46','OTNo1jK7ko8642AkfbTIAGJYEQeFS3R10IalZcU6JPR82Ws1','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727275759,1773727275759,1773756075758,0,NULL);
INSERT INTO UserSession VALUES('cmmu7fl3n00cerqcgydgb5u8t','cmmnqsfl8000003yp8yo84l46','JyWhoshR3C7r9zV6F7dXHN3twR8UYbSVwqAwx6IDaGB4WN2D','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727291283,1773727291283,1773756091283,0,NULL);
INSERT INTO UserSession VALUES('cmmu7fl3f00cdrqcgktbfdqau','cmmnqsfld000103yp3d86suci','zCDWQsPGUVJr36ToOua07gBTEetMSuxXspkU1l0CrIwlmTWt','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727291275,1773727291275,1773756091274,1,NULL);
INSERT INTO UserSession VALUES('cmmu7fl5g00clrqcgt5t2nubm','cmmnqsfl8000003yp8yo84l46','s1uSXclIsrXIL3on12AhYNqRhRsVBCvcNoTmuDjuB1MZRTEK','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727291348,1773727291348,1773756091347,0,NULL);
INSERT INTO UserSession VALUES('cmmu7fnfp00ctrqcgof49g1me','cmmnqsfld000103yp3d86suci','XXgRlue78JDbbnbH5ZlKnCXgJlbOWrHveclDaECaQ6g5KfH2','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727294310,1773727294310,1773756094309,1,NULL);
INSERT INTO UserSession VALUES('cmmu7fp5d00cyrqcgm63wi3xm','cmmnqsfl8000003yp8yo84l46','ZeMpZSSeXQkTpqWHn9GwbXhsxiWFkLxf8AC3XeG6fQsvSA9j','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727296530,1773727296530,1773756096529,0,NULL);
INSERT INTO UserSession VALUES('cmmu7fqh600d3rqcgh6f26zca','cmmnqsfl8000003yp8yo84l46','3tME71OWSoqG2jJQJxWaNCXmWsRQHDNvvUe8oexGFeKVEqLl','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727298251,1773727298251,1773756098250,0,NULL);
INSERT INTO UserSession VALUES('cmmu7fsag00d8rqcgp354xxv7','cmmnqsfl8000003yp8yo84l46','ppP2BuIErYrtk40tTzIspuWh40SjajI7EpOs9DF1yAp0blRM','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727300601,1773727300601,1773756100598,0,NULL);
INSERT INTO UserSession VALUES('cmmu7fu7q00ddrqcgn3p12bj7','cmmnqsfl8000003yp8yo84l46','wdZ4J8MSFmyZyb9LPEwcdNsGR87ASW9LCkDEfCbIIFpt9aKG','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727303094,1773727303094,1773756103093,0,NULL);
INSERT INTO UserSession VALUES('cmmu7fvy900dirqcgg3k99sx5','cmmnqsfl8000003yp8yo84l46','zfZyWamsu3P9ZXZOooBOkC7RFI7qrp3yV1hTaFCs5QNZBx3C','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727305346,1773727305346,1773756105345,0,NULL);
INSERT INTO UserSession VALUES('cmmu7glpa00dnrqcg3w5kzg99','cmmnqsfl8000003yp8yo84l46','zmSj3csiG01CJ3HQPAn53BtDuChZrMkiCM2Gx08QalkzmRQY','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727338719,1773727338719,1773756138718,0,NULL);
INSERT INTO UserSession VALUES('cmmu7gmyj00dsrqcg9nnqpo01','cmmnqsfl8000003yp8yo84l46','Nfx2q7hZ2HWElgWlExZf2eUN47znCUn9RRTEMctUEnmhiAlh','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727340347,1773727340347,1773756140347,0,NULL);
INSERT INTO UserSession VALUES('cmmu7go7c00dxrqcgegv941x8','cmmnqsfl8000003yp8yo84l46','12iDDr2QppvgB5HYs14r27aPT5V9MTEiuPRhJvVeeNOy8Z0g','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727341961,1773727341961,1773756141960,0,NULL);
INSERT INTO UserSession VALUES('cmmu7gpev00e2rqcgyh3tdmjr','cmmnqsfl8000003yp8yo84l46','XPxEHhRJgDZ8aqWlh9JzZzQ7jVwwHBXXrit4vDci0nh6noYs','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727343527,1773727343527,1773756143527,0,NULL);
INSERT INTO UserSession VALUES('cmmu7gprw00e7rqcg68b2i3m3','cmmnqsfl8000003yp8yo84l46','FzW5jWn0t6bVECvhk5Ll3GSv2ok1i2Co80xAk7Twled0Srsh','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727343997,1773727343997,1773756143996,0,NULL);
INSERT INTO UserSession VALUES('cmmu7gq3v00ecrqcgcigyl3jw','cmmnqsfl8000003yp8yo84l46','3TNOhQq0UPnG266QoGh2kCaBqhc8zbfafdOQAVw6tw7f7buL','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727344427,1773727344427,1773756144427,0,NULL);
INSERT INTO UserSession VALUES('cmmu7grda00ehrqcgk4jd3g7h','cmmnqsfl8000003yp8yo84l46','7NwxLCgGHiZIVATJ3sZpGIyV9jZ3TBfaf1qWZS3rDN5PIn8X','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0.1) Gecko/20100101 Firefox/146.0.1',1773727346062,1773727346062,1773756146061,0,NULL);
INSERT INTO UserSession VALUES('cmmu7gtnm00emrqcg6lq5zjyl','cmmnqsfl8000003yp8yo84l46','JsD3lN5IpSyXAkeZQbBrLuhQa8MOFXfxhexJj7ciZyowR6OB','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0.1) Gecko/20100101 Firefox/146.0.1',1773727349026,1773727349026,1773756149026,0,NULL);
INSERT INTO UserSession VALUES('cmmu7gwpj00errqcg50r066pv','cmmnqsfl8000003yp8yo84l46','hMSF4jgRfP5UA4Rz4B2YUvnorf0IsDsGdRZxGMgy22gz2AWU','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727352984,1773727352984,1773756152977,0,NULL);
INSERT INTO UserSession VALUES('cmmu7gwrt00eurqcgkm9ln0zq','cmmnqsfl8000003yp8yo84l46','3ukCEaRbVW2RQQKBv58nhwfsQjGiQzJed8K4t379lArVJvrm','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727353065,1773727353065,1773756153062,0,NULL);
INSERT INTO UserSession VALUES('cmmu7h4hp00f1rqcg5pkrzqbp','cmmnqsfl8000003yp8yo84l46','6cYV4Rpl9tDw5qPrzcGCfsOokyeZp6ZCtEERIOjuYmfgvn2r','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0.1) Gecko/20100101 Firefox/146.0.1',1773727363070,1773727363070,1773756163069,0,NULL);
INSERT INTO UserSession VALUES('cmmu7h6i100f6rqcgtmfl5yo0','cmmnqsfl8000003yp8yo84l46','UOYdU2GJrElEgmiDq6hxpsUOpMkNQP51Cx2vujATXM5lzZrZ','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0.1) Gecko/20100101 Firefox/146.0.1',1773727365673,1773727365673,1773756165673,0,NULL);
INSERT INTO UserSession VALUES('cmmu7h6uq00fbrqcgp17lz7xr','cmmnqsfl8000003yp8yo84l46','qrlCAXDxjstUgg7HpRFrzAPnYbcwnl6xwRAyJRKnkcs0MFW5','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0.1) Gecko/20100101 Firefox/146.0.1',1773727366130,1773727366130,1773756166130,0,NULL);
INSERT INTO UserSession VALUES('cmmu7hjri00fgrqcg0y05w2ub','cmmnqsfl8000003yp8yo84l46','FeixG1shcMGlmQb7crirkSqke2d9SxpOd7gstWAoS77WVrZN','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727382862,1773727382862,1773756182861,0,NULL);
INSERT INTO UserSession VALUES('cmmu7hmy600flrqcge0k9owd3','cmmnqsfld000203yp9v7ir4ts','4Mcys6E1DCrAJlue3a94OJyXZW4zy03Ssd4bxdoAb0slNtNE','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727386990,1773727386990,1773756186989,1,NULL);
INSERT INTO UserSession VALUES('cmmu7hnmv00fqrqcg7lwarkw1','cmmnqsfld000103yp3d86suci','XVCWEMBjvpPast8NF6LHWikentdASMFJNrkEj0SswfKCAxsr','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727387879,1773727387879,1773756187878,1,NULL);
INSERT INTO UserSession VALUES('cmmu7hryy00fvrqcg26kv9w55','cmmnqsfle000303yp8iavv5sw','bOwcfO7kbJPigEQPU4coqNEV3WCuWU2skVnmt1sif8xKpfcB','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727393499,1773727393499,1773756193498,1,NULL);
INSERT INTO UserSession VALUES('cmmu7j0gg00g0rqcgjv154ad5','cmmnqsfl8000003yp8yo84l46','axIRbvGTZ0sqA1rAmD9WJDrLNXzA3POscGUBvLhNK2qsYLmE','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727451152,1773727451152,1773756251144,0,NULL);
INSERT INTO UserSession VALUES('cmmu7j0ik00g5rqcgneqoiavf','cmmnqsfl8000003yp8yo84l46','dYOc4Az34rWjCklmmh8qSNs72jGC0mgMVMzTppxN2Qz20gHt','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727451229,1773727451229,1773756251227,0,NULL);
INSERT INTO UserSession VALUES('cmmu7j0ja00g6rqcg8ke308mq','cmmnqsfl8000003yp8yo84l46','niwH7UVZiKEiMFkhW58ezhi1fm0KFqvkpPEb2giU5TsUkVLt','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727451254,1773727451254,1773756251253,0,NULL);
INSERT INTO UserSession VALUES('cmmu7j0jd00g7rqcghxmrre1z','cmmnqsfl8000003yp8yo84l46','WLTKrjGxX5RLmAxqcEttfgd0aahqPsqJdpRe3DLNMyry6TK9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727451257,1773727451257,1773756251256,0,NULL);
INSERT INTO UserSession VALUES('cmmu7j4ez00gkrqcgtoktehsx','cmmnqsfl8000003yp8yo84l46','hIVlRbzdGMxxmE7NfBftrNv8r1XhBD5VgeEyD8LyC26dA54t','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727456284,1773727456284,1773756256281,0,NULL);
INSERT INTO UserSession VALUES('cmmu7j64g00gprqcgfyupvkdr','cmmnqsfl8000003yp8yo84l46','WL4H5YQDykOI2KTxY5Gn87Df6Os2afuBpENdUerJlgOhGH94','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727458497,1773727458497,1773756258495,0,NULL);
INSERT INTO UserSession VALUES('cmmu7j6cf00gurqcg9lca6qxf','cmmnqsfl8000003yp8yo84l46','SCiIpIYOHS0uyMmikvyPDF55aYbYE7MvUjkFPPn3Q0zpW2C7','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727458784,1773727458784,1773756258777,0,NULL);
INSERT INTO UserSession VALUES('cmmu7ja4y00gzrqcg9wr6y9j8','cmmnqsfl8000003yp8yo84l46','QMollJgOyDr14eZzTcJJzTyWFJ4PclVAGfClbx5l65OspVwP','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727463698,1773727463698,1773756263697,0,NULL);
INSERT INTO UserSession VALUES('cmmu7jdvo00h4rqcganqes6s6','cmmnqsfl8000003yp8yo84l46','JzTlNLJG5lIHBWBNNBf3ZMlzrb1Qu88w1tqv3MFFTKOt6ISP','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727468548,1773727468548,1773756268547,0,NULL);
INSERT INTO UserSession VALUES('cmmu7jdvo00h5rqcgs5v5dvw6','cmmnqsfl8000003yp8yo84l46','kW5oyOBdtNRFu6oTtGQiHbgclUEm3uZzbr8Y5UbKQSSQsN08','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727468549,1773727468549,1773756268547,0,NULL);
INSERT INTO UserSession VALUES('cmmu7kup200herqcgtm6gbaaq','cmmnqsfl8000003yp8yo84l46','zhOIRlLihDg67xDDzWLmmESKp47dqbuUR2XUOdanrOvS7LzY','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727536999,1773727536999,1773756336998,0,NULL);
INSERT INTO UserSession VALUES('cmmu7l0gg00hjrqcgbjovmlhh','cmmnqsfl8000003yp8yo84l46','Q01pckB4MBBqj2Za9PnyXv8kZWC1k20RFPjToBIbhXLJ4FsZ','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773727544465,1773727544465,1773756344464,0,NULL);
INSERT INTO UserSession VALUES('cmmu7mj2x00horqcgpbfdsssl','cmmnqsfl8000003yp8yo84l46','8txHBYeUnhACqpAt6PGEvpJXFKj6jJQBKvr3mAhmhIQ68CxH','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/145.0.7632.6 Safari/537.36',1773727615257,1773727615257,1773756415257,0,NULL);
INSERT INTO UserSession VALUES('cmmu7owfu00htrqcg8vlnyr22','cmmnqsfl8000003yp8yo84l46','RKlncOe01HydSp1ZOPlMQ6GnRF7YzZAaDnmLOEGRtRFVlQF0','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/145.0.7632.6 Safari/537.36',1773727725882,1773727725882,1773756525881,0,NULL);
INSERT INTO UserSession VALUES('cmmu7qc8u00hyrqcgp10osqnz','cmmnqsfl8000003yp8yo84l46','RiOxYwdYgXGqFl6pfjFKWGlpbHySWqzm4iodjJpiiV5AEWrW','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/145.0.7632.6 Safari/537.36',1773727793022,1773727793022,1773756593021,0,NULL);
INSERT INTO UserSession VALUES('cmmu7rnh200i3rqcgsc8xvskd','cmmnqsfl8000003yp8yo84l46','IaOkeLJXVVRJqbXpj6Y71kj2AShIhk7UPWZq01hcIOsTSTDP','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/145.0.7632.6 Safari/537.36',1773727854230,1773727854230,1773756654230,0,NULL);
INSERT INTO UserSession VALUES('cmmu7trbt00i8rqcgirik4wpl','cmmnqsfl8000003yp8yo84l46','vachYIA4xRVdgWqMGDsdDh7XSwEtIffCVnOxZeJ2Eam0vOlQ','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/145.0.7632.6 Safari/537.36',1773727952537,1773727952537,1773756752537,0,NULL);
INSERT INTO UserSession VALUES('cmmu7war100idrqcgj8yh761o','cmmnqsfl8000003yp8yo84l46','wEl4PE8ZZpzmFNS81DqBddaJeL2W8FuNKVrMMoYvvQzLifRM','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/145.0.7632.6 Safari/537.36',1773728071021,1773728071021,1773756871021,0,NULL);
INSERT INTO UserSession VALUES('cmmu88x7d0000rqd8uj3kj9vf','cmmnqsfl8000003yp8yo84l46','zg2yVeOLG8Jx6EF94Bd7dMNzwWcYsGXiCh67Z1O5CYubx9gS','::1','curl/8.7.1',1773728659994,1773728659994,1773757459993,0,NULL);
INSERT INTO UserSession VALUES('cmmu8uskw0000rqfcnx3gvtco','cmmnqsfl8000003yp8yo84l46','E4euKNbIpnKhIbsw9e57aakysotPTty5QpF4xElruaWeAEDT','::1','curl/8.7.1',1773729680432,1773729680432,1773758480432,0,NULL);
INSERT INTO UserSession VALUES('cmmu94x7e0000rq2i3ev9b88k','cmmnqsfl8000003yp8yo84l46','P3ReEdHNcyaa1o9Xim9cC4kO3d5JLViJgzdACAgLmYLBn2Bi','127.0.0.1','curl/8.7.1',1773730152987,1773730152987,1773758952986,0,NULL);
INSERT INTO UserSession VALUES('cmmu954wv0005rq2ivnsew84t','cmmnqsfl8000003yp8yo84l46','7XqNkKLscbsqlJ0Wyj6uUFLQkl3hZpkndXu7DyD4LZhB7iam','127.0.0.1','curl/8.7.1',1773730162976,1773730162976,1773758962975,0,NULL);
INSERT INTO UserSession VALUES('cmmu96n7r0000rq6b4yf4l7gx','cmmnqsfl8000003yp8yo84l46','PuspIYV0EckNs518Oirl8mBSgaZojhe6Q7gPp38PiIIsgTNj','127.0.0.1','curl/8.7.1',1773730233351,1773730233351,1773759033351,0,NULL);
INSERT INTO UserSession VALUES('cmmu96tk90005rq6brpawz562','cmmnqsfl8000003yp8yo84l46','6gotWyVeL01XAvsunhZwpFPtAxLtuG7X9dvuXNFFhT3X8ata','127.0.0.1','curl/8.7.1',1773730241578,1773730241578,1773759041577,0,NULL);
INSERT INTO UserSession VALUES('cmmu974yq000arq6b8bge5ta9','cmmnqsfl8000003yp8yo84l46','OBGu5JHxrDBeVCnmT6b4Nk7vkosPp1FSrmstCqyc9qVR6RyF','127.0.0.1','curl/8.7.1',1773730256354,1773730256354,1773759056354,0,NULL);
INSERT INTO UserSession VALUES('cmmu98bh6000frq6b252drkzc','cmmnqsfl8000003yp8yo84l46','pUsJEr5eKR4AyzwEAnrSALdluqsU9KrlMqyNf3WUT9xVVg2U','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773730311451,1773730311451,1773759111450,0,NULL);
INSERT INTO UserSession VALUES('cmmu98bhv000krq6b64rgitzr','cmmnqsfl8000003yp8yo84l46','jptGioP5YyhI887zfS6OEO1L9zQvO3bOym5Yn88M38gQSFIJ','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773730311476,1773730311476,1773759111475,0,NULL);
INSERT INTO UserSession VALUES('cmmu98bji000prq6ba7q53vrv','cmmnqsfl8000003yp8yo84l46','KTwYfY8MnEGN15czy5rBbwmL7gXvSk7AZGCV2BYW4idMuSyL','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773730311535,1773730311535,1773759111532,0,NULL);
INSERT INTO UserSession VALUES('cmmu98blo000qrq6bjafxegye','cmmnqsfl8000003yp8yo84l46','6fIQpbIjwfrlopZ5xM30aNsXSHcZROJ2UzJdahdmythAEtXu','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773730311612,1773730311612,1773759111611,0,NULL);
INSERT INTO UserSession VALUES('cmmu98oex000zrq6bf1gb0m04','cmmnqsfl8000003yp8yo84l46','K37dJBWH1djmAF1N5qQCefHnsbqyJs8XJ3XjsNCO50FJU9lo','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773730328218,1773730328218,1773759128217,0,NULL);
INSERT INTO UserSession VALUES('cmmu98oir0010rq6bqzk8cbjy','cmmnqsfl8000003yp8yo84l46','CrvqWTZcwa1c2orrthRZr4BKDr49ZEGbpCvcAhKhDxkMyq4Y','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773730328355,1773730328355,1773759128354,0,NULL);
INSERT INTO UserSession VALUES('cmmu98oj10013rq6byjb3qka1','cmmnqsfl8000003yp8yo84l46','Ux6azsqCYTDPu0uDSq6KUcKw1dfbdvro5Z1iAFUAVUkb5UaD','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773730328365,1773730328365,1773759128364,0,NULL);
INSERT INTO UserSession VALUES('cmmu98okq001crq6b2rqw7jov','cmmnqsfl8000003yp8yo84l46','dyiTTjs5N7VzzXUYNIrM4J6YwRoySoS9i0HQ9GxUx8DGVEAk','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773730328427,1773730328427,1773759128425,0,NULL);
INSERT INTO UserSession VALUES('cmmu98vmu001jrq6b9oooki7g','cmmnqsfl8000003yp8yo84l46','fZvYCW492FyQRwaN9Ny1VlBdTeylPdWYXRAIktF6r0cR37Rw','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773730337574,1773730337574,1773759137573,0,NULL);
INSERT INTO UserSession VALUES('cmmu98vn2001krq6bvi129g2m','cmmnqsfl8000003yp8yo84l46','lCIss0VGNPaUOsSogSQlUbNq2Bw2LCGvWRmwt8ENkAoZeurh','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773730337583,1773730337583,1773759137582,0,NULL);
INSERT INTO UserSession VALUES('cmmu98vna001lrq6blwulmzsb','cmmnqsfl8000003yp8yo84l46','5bQe4plsTse8BP6aK2SjXJ6eucDKxGeNtpz2McWloD5w9mNv','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773730337590,1773730337590,1773759137589,0,NULL);
INSERT INTO UserSession VALUES('cmmu98wy6001yrq6bwb8oqjfz','cmmnqsfl8000003yp8yo84l46','Jh6icSIEQoCLHM4Uij7SY9II4FarZJxhGAxJqta9h3FMgCJq','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773730339278,1773730339278,1773759139277,0,NULL);
INSERT INTO UserSession VALUES('cmmu992jk0023rq6bw5kn51wz','cmmnqsfl8000003yp8yo84l46','kkajMnXIIwZTfETnvcFObiDuE7MFae7NDnepAcTu7KbEiAEX','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773730346529,1773730346529,1773759146526,0,NULL);
INSERT INTO UserSession VALUES('cmmu9932a0028rq6b1oluskjf','cmmnqsfl8000003yp8yo84l46','YIl7kCPidlsv8jHbUFvkphezScg455f5weNptL2WYFPfnqFB','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773730347203,1773730347203,1773759147202,0,NULL);
INSERT INTO UserSession VALUES('cmmu9932h002brq6bwj2q513j','cmmnqsfl8000003yp8yo84l46','41KpMyzgFVRIvoOJ3sJ8BHIvmPVFILti0kGaFomSuf5epg14','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773730347210,1773730347210,1773759147209,0,NULL);
INSERT INTO UserSession VALUES('cmmu994u8002irq6bo9hqby0b','cmmnqsfl8000003yp8yo84l46','LmzwPB2yAKr18qF1VqeT9NNMvW9hz5Mq1wL2Z2iwPPmuMN12','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36',1773730349505,1773730349505,1773759149504,0,NULL);
INSERT INTO UserSession VALUES('cmmu9acp5002orq6bizghc3eu','cmmnqsfl8000003yp8yo84l46','KkJGer9WvzpfMf9p1dUSxdqDDltd6PjfTzfqLdnW1tV6X2d4','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6',1773730406345,1773730406345,1773759206344,1,NULL);
INSERT INTO UserSession VALUES('cmmu9acpg002prq6bazfw6u8o','cmmnqsfl8000003yp8yo84l46','6yuIskgkmehWf25pvsvDshndAE6ZQgXGJ5NspHlepKHqton1','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6',1773730406357,1773730406357,1773759206353,1,NULL);
INSERT INTO UserSession VALUES('cmmu9acp4002nrq6b85gqghn2','cmmnqsfl8000003yp8yo84l46','KrrtTJmtt2BC57qfIwsOiMS7Xg3TUYxxbg0tyzPapRt56qqD','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6',1773730406344,1773730406344,1773759206343,1,NULL);
INSERT INTO UserSession VALUES('cmmu9acuz0032rq6bxnfhmiy6','cmmnqsfl8000003yp8yo84l46','YinSjJZnJ47Nf5cG8b4l4owiuKXvp2OjtvUORVz1hmcEGrSb','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6',1773730406556,1773730406556,1773759206553,1,NULL);
INSERT INTO UserSession VALUES('cmmu9avo70038rq6bbeauzkbq','cmmnqsfl8000003yp8yo84l46','d2bQkcv1Kwz1zvA5KtMvHOX7VybyChSlz1k58E6anrt1ehXg','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6',1773730430936,1773730430936,1773759230935,1,NULL);
INSERT INTO UserSession VALUES('cmmu9avoh003drq6b5tbhhgoq','cmmnqsfl8000003yp8yo84l46','7W1rHoa4gXeYG20mA6bmmlQ1Qow8aosit4Jqh2CRFBrNc2mK','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6',1773730430945,1773730430945,1773759230945,1,NULL);
INSERT INTO UserSession VALUES('cmmu9avo50037rq6bhh3uqh13','cmmnqsfl8000003yp8yo84l46','LkqA1ZaDcgonDYivFKMFywpV3uZEFXBNcCwAUvscgv55BueV','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6',1773730430933,1773730430933,1773759230932,1,NULL);
INSERT INTO UserSession VALUES('cmmu9avtk003mrq6baxwtyalq','cmmnqsfl8000003yp8yo84l46','TfVABZApC8PZvA7JAPGH1G7nBUa9ZzO9fQ9n8s4CDGCUPSRB','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6',1773730431129,1773730431129,1773759231116,1,NULL);
INSERT INTO UserSession VALUES('cmmu9bczk003rrq6bmjnonnut','cmmnqsfl8000003yp8yo84l46','akrB7pFQtg8jPFVGF1csyoXF8JotAz3KxBEoMgcU1mAzC9zf','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6',1773730453376,1773730453376,1773759253375,1,NULL);
INSERT INTO UserSession VALUES('cmmu9bczo003trq6b8i2p41w4','cmmnqsfl8000003yp8yo84l46','XpVrcbhY7wFuLGuMSb5U4qoClETgCaugVygpyFYr2PRCR4yW','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6',1773730453380,1773730453380,1773759253380,1,NULL);
INSERT INTO UserSession VALUES('cmmu9bd040040rq6b6tjfu2e8','cmmnqsfl8000003yp8yo84l46','MBAB71bfZl3HzfRgMniIqsyHUV3TL2zTY7qGLVhY9E8BxgE5','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6',1773730453397,1773730453397,1773759253396,1,NULL);
INSERT INTO UserSession VALUES('cmmu9bczl003srq6bxm44kpeo','cmmnqsfl8000003yp8yo84l46','U8OwCuq0bjSh4ixYFwaxQaz1MXniqEgXxx6mkARQUEvjBBFu','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6',1773730453377,1773730453377,1773759253376,1,NULL);
INSERT INTO UserSession VALUES('cmmu9bted004brq6bvn5s2iyy','cmmnqsfl8000003yp8yo84l46','uPHHTa2pPpCZ8Pi5ifNiIPIe58aTA6W4eYPxDa4iGFyKW3Ss','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6',1773730474646,1773730474646,1773759274645,1,NULL);
INSERT INTO UserSession VALUES('cmmu9bteg004crq6b2nlfh9qd','cmmnqsfl8000003yp8yo84l46','yopvuOU7Oo4NLaFjEmjK7SotoRw7TqOv5Ln3v5B9owU5uAZn','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6',1773730474648,1773730474648,1773759274647,1,NULL);
INSERT INTO UserSession VALUES('cmmu9btfb004lrq6btt4id55v','cmmnqsfl8000003yp8yo84l46','1B5H8hfCIZyDt6LkY4oqIxmuwQMrO7jjuxgZXJAsBvTnyOBE','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6',1773730474679,1773730474679,1773759274678,1,NULL);
INSERT INTO UserSession VALUES('cmmu9btgk004qrq6brjy6q0h8','cmmnqsfl8000003yp8yo84l46','IJXTZyiptZPRZ3xEHgOSNpkvNs8hU2raLagheJQhEJEr2WVB','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36 Edg/145.0.7632.6',1773730474724,1773730474724,1773759274723,1,NULL);
INSERT INTO UserSession VALUES('cmmu9cabc004vrq6bmocag085','cmmnqsfl8000003yp8yo84l46','mQrbAZG25jBaUmNg7pwLAZXxILrZJEzfaAHW2cM1oh7rdlKo','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730496568,1773730496568,1773759296567,1,NULL);
INSERT INTO UserSession VALUES('cmmu9cabc004wrq6bpl01klyj','cmmnqsfl8000003yp8yo84l46','JPfZuhyq2Q5nVMBzgNTqGkZxvxdDjERocRgtMLp1U3uj0Njr','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730496568,1773730496568,1773759296568,1,NULL);
INSERT INTO UserSession VALUES('cmmu9cabm0053rq6b5psweb0y','cmmnqsfl8000003yp8yo84l46','E10RPRKWqKGdZpqwGJeaaGVsA4iN4vfSXngiBVPvT8DVclQS','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730496578,1773730496578,1773759296577,1,NULL);
INSERT INTO UserSession VALUES('cmmu9cbcw005arq6b61yqklwk','cmmnqsfl8000003yp8yo84l46','oib359cxXxBvbzixFjusYKxhgYOZPS8ACiFYiisu6tm2pp5R','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730497920,1773730497920,1773759297920,1,NULL);
INSERT INTO UserSession VALUES('cmmu9ci46005frq6bok8tlndp','cmmnqsfl8000003yp8yo84l46','q0uR0bLTJhZ0vY0c3xqM0EEDRif7lYWwdSZjrRFUvfrd89Hy','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730506678,1773730506678,1773759306678,1,NULL);
INSERT INTO UserSession VALUES('cmmu9ci4f005irq6blhq8mj3a','cmmnqsfl8000003yp8yo84l46','x3QNPJ9xU9suh2u8PHYoY9WPrPBigZqfwR42hOJOjctz3jfq','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730506688,1773730506688,1773759306687,1,NULL);
INSERT INTO UserSession VALUES('cmmu9ci5g005prq6bcle0ftxw','cmmnqsfl8000003yp8yo84l46','M2KgOxoG7C1veKlURZkU2aJ4qroPCKjvAsdfUyEsUIEuJHJ1','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730506724,1773730506724,1773759306721,1,NULL);
INSERT INTO UserSession VALUES('cmmu9cinp005urq6bi05xj9s3','cmmnqsfl8000003yp8yo84l46','0BvbhqdLntlSRKPpP1RKvTpuTCf7CcZFOa6Gibaqkv0xkaWr','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730507381,1773730507381,1773759307381,1,NULL);
INSERT INTO UserSession VALUES('cmmu9cpcm0060rq6bs6rskwc3','cmmnqsfl8000003yp8yo84l46','1axwrJM3UqTED3T6XYyr449YslA3Vlmd591mWDwC87QYOfxP','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730516054,1773730516054,1773759316051,1,NULL);
INSERT INTO UserSession VALUES('cmmu9cpc6005zrq6baals3p9g','cmmnqsfl8000003yp8yo84l46','O7HoNlHYX0f6Sxm0efrzcaDbwGYh6o4jgnfw9BJGFSKhb3nf','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730516038,1773730516038,1773759316037,1,NULL);
INSERT INTO UserSession VALUES('cmmu9cpq20069rq6bugzd9hoc','cmmnqsfl8000003yp8yo84l46','QxGgTvk5LY1qi6239d0wYPajJZ3hOO4OesvM5RVYDR6ylvoe','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730516539,1773730516539,1773759316538,1,NULL);
INSERT INTO UserSession VALUES('cmmu9cq06006erq6b6tulr5yt','cmmnqsfl8000003yp8yo84l46','aCzpldjFKpFqUig1nhM3xdqnYUkt222EwA7PGEp78zsIyxOz','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730516902,1773730516902,1773759316902,1,NULL);
INSERT INTO UserSession VALUES('cmmu9cw2n006jrq6bom4amo2i','cmmnqsfl8000003yp8yo84l46','RczMSa9EnHqLLVL812Ak3rt7zjvQHDMiFUm7YWFIxcMJHMqx','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730524768,1773730524768,1773759324767,1,NULL);
INSERT INTO UserSession VALUES('cmmu9cw2s006orq6bbh3u4pvn','cmmnqsfl8000003yp8yo84l46','FilpqhN0BGV27WvunWGLhECaCu5LDTm4m1vabTyHM6NsxUP2','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730524772,1773730524772,1773759324771,1,NULL);
INSERT INTO UserSession VALUES('cmmu9cwkc006trq6bm1cu5jm5','cmmnqsfl8000003yp8yo84l46','ilsLu7mYfnik3jRlq21jPBGQxiVkoTycGPi1Ci0JsNwVm47t','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730525404,1773730525404,1773759325403,1,NULL);
INSERT INTO UserSession VALUES('cmmu9cwva006yrq6bgv4fp95b','cmmnqsfl8000003yp8yo84l46','uiQ2O9TN7JyYvdyCp93UGgCYQ9SUWzqWlbrcmfXbJ7PINO9e','127.0.0.1','Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730525798,1773730525798,1773759325798,1,NULL);
INSERT INTO UserSession VALUES('cmmu9deau0073rq6b6hdg4w4y','cmmnqsfl8000003yp8yo84l46','hIwfJij9Wio4nxMH4Ds9BxVL5lIVYS9zCeeo4fVHRC7x919f','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730548390,1773730548390,1773759348390,1,NULL);
INSERT INTO UserSession VALUES('cmmu9deav0074rq6bro3goj9i','cmmnqsfl8000003yp8yo84l46','TozEsfL1cBzHlYy7FhSBf6xKo9izvQEJym74z3uJudm86gq6','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730548392,1773730548392,1773759348391,1,NULL);
INSERT INTO UserSession VALUES('cmmu9debn007drq6b14kjhv3e','cmmnqsfl8000003yp8yo84l46','Wbw8ow1yPTqAT7sWhFNqY79GhKAdrxgoW4gec5ixscAE9Wvs','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730548420,1773730548420,1773759348419,1,NULL);
INSERT INTO UserSession VALUES('cmmu9debp007erq6bu348jg1q','cmmnqsfl8000003yp8yo84l46','9ntWW9EC3ZO11h5mPtGcTIDRFsUZloHIwFYy15iMqhiHY26X','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730548421,1773730548421,1773759348420,1,NULL);
INSERT INTO UserSession VALUES('cmmu9dn1r007nrq6bajq04d2p','cmmnqsfl8000003yp8yo84l46','1yhOnHwKRWldRDGmoZODXNsW9S2AuKYQLu9eoamXxHYFnA1f','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730559728,1773730559728,1773759359727,1,NULL);
INSERT INTO UserSession VALUES('cmmu9dn22007srq6byfyyyuc1','cmmnqsfl8000003yp8yo84l46','9zzr9Rj5mylUQEJcHm318w2wZArpteUqDPKlGMi5ehGdAvfa','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730559738,1773730559738,1773759359737,1,NULL);
INSERT INTO UserSession VALUES('cmmu9dn2d007xrq6bmavtezon','cmmnqsfl8000003yp8yo84l46','pt9g8oVGpfSyngL2zAdEbZNa2eKJNHKas7QXOhRand8nJstY','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730559750,1773730559750,1773759359749,1,NULL);
INSERT INTO UserSession VALUES('cmmu9dn3p0082rq6brsjgljn3','cmmnqsfl8000003yp8yo84l46','ZZ8FSjrD0cuoEE4EUF91dW3FO1xkWW9sfISm31aSwxDaoJI3','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730559798,1773730559798,1773759359797,1,NULL);
INSERT INTO UserSession VALUES('cmmu9du770087rq6bt1pekkok','cmmnqsfl8000003yp8yo84l46','vMI7QtklWelXiFJc4J19cd9vv3BwKQGxuUFImKPs3HSVD9N4','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730568995,1773730568995,1773759368994,1,NULL);
INSERT INTO UserSession VALUES('cmmu9duo3008crq6bjv9bnrmv','cmmnqsfl8000003yp8yo84l46','UxtdhvVg9giGEpsMxzaS4BYVG5zKPiUDOkYbQM8n6aOEjS0d','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730569603,1773730569603,1773759369603,1,NULL);
INSERT INTO UserSession VALUES('cmmu9duod008hrq6beky89r7v','cmmnqsfl8000003yp8yo84l46','8SLd9Lsfa1WyB984Z84ythBd2VUKg3yc0TkP2A0JPzqzq5b5','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730569614,1773730569614,1773759369613,1,NULL);
INSERT INTO UserSession VALUES('cmmu9duov008mrq6bybj5okiw','cmmnqsfl8000003yp8yo84l46','1rA7WRE8MmLpXwULqa5sqGdkl7zA85avY9X7omjW7kmGrLnh','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730569631,1773730569631,1773759369631,1,NULL);
INSERT INTO UserSession VALUES('cmmu9e0tk008rrq6b0b88yyjm','cmmnqsfl8000003yp8yo84l46','comk1vJF6RMSPTfKf2Tnv1jkO9g0O9ZJgZI0g5OgrgEmSocj','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730577576,1773730577576,1773759377576,1,NULL);
INSERT INTO UserSession VALUES('cmmu9e1vn008wrq6b84mfovkh','cmmnqsfl8000003yp8yo84l46','gBSxElNXfvuo0gFBsaXbObycxVOTGfyg4pB8IztOURatKfcE','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730578948,1773730578948,1773759378947,1,NULL);
INSERT INTO UserSession VALUES('cmmu9e1vs0091rq6bedvpzw53','cmmnqsfl8000003yp8yo84l46','vr7wOE0bmiowJEz15CgKzRhSefrgu7gDPxNUdpibyA9Wtpln','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730578953,1773730578953,1773759378952,1,NULL);
INSERT INTO UserSession VALUES('cmmu9e1vx0092rq6b3icxtwai','cmmnqsfl8000003yp8yo84l46','nbpVTSAa8asWy4BvdtpXYDdsJIfscHe0xRsXE7E7U6gfRT3N','127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36',1773730578958,1773730578958,1773759378957,1,NULL);
INSERT INTO UserSession VALUES('cmmu9fj8j009brq6b847t8d58','cmmnqsfl8000003yp8yo84l46','8oRYtABTVOPPxtEOILXC6prMcmyfQRWYcpUe50dBR43c2SjB','127.0.0.1','curl/8.7.1',1773730648099,1773730648099,1773759448099,1,NULL);
INSERT INTO UserSession VALUES('cmmu9ydd7009grq6bxjie5gad','cmmnqsfl8000003yp8yo84l46','1bWeWVUi9n0WRYdBnrMZHHDPWH9UYhU2mbYsnQR3AiOjQVk5','127.0.0.1','curl/8.7.1',1773731526956,1773731526956,1773760326955,1,NULL);
CREATE TABLE IF NOT EXISTS "VatRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "documentNo" TEXT NOT NULL,
    "documentDate" DATETIME NOT NULL,
    "documentType" TEXT,
    "referenceId" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "customerTaxId" TEXT,
    "vendorId" TEXT,
    "vendorName" TEXT,
    "vendorTaxId" TEXT,
    "description" TEXT,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "vatRate" REAL NOT NULL DEFAULT 7,
    "vatAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "taxMonth" INTEGER NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "reportStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "WithholdingTax" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "documentNo" TEXT NOT NULL,
    "documentDate" DATETIME NOT NULL,
    "documentType" TEXT,
    "referenceId" TEXT,
    "payeeId" TEXT,
    "payeeName" TEXT NOT NULL,
    "payeeTaxId" TEXT,
    "payeeAddress" TEXT,
    "description" TEXT,
    "incomeType" TEXT,
    "incomeAmount" INTEGER NOT NULL DEFAULT 0,
    "whtRate" REAL NOT NULL DEFAULT 3,
    "whtAmount" INTEGER NOT NULL DEFAULT 0,
    "taxMonth" INTEGER NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "reportStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "ChartOfAccount_code_key" ON "ChartOfAccount"("code");
CREATE UNIQUE INDEX "Vendor_code_key" ON "Vendor"("code");
CREATE UNIQUE INDEX "Vendor_externalRefId_key" ON "Vendor"("externalRefId");
CREATE UNIQUE INDEX "DocumentNumber_type_key" ON "DocumentNumber"("type");
CREATE UNIQUE INDEX "ApiToken_tokenHash_key" ON "ApiToken"("tokenHash");
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");
CREATE UNIQUE INDEX "WarehouseZone_warehouseId_code_key" ON "WarehouseZone"("warehouseId", "code");
CREATE UNIQUE INDEX "StockTransfer_transferNo_key" ON "StockTransfer"("transferNo");
CREATE UNIQUE INDEX "BankAccount_code_key" ON "BankAccount"("code");
CREATE UNIQUE INDEX "SystemSettings_companyId_key" ON "SystemSettings"("companyId");
CREATE UNIQUE INDEX "StockTake_stockTakeNumber_key" ON "StockTake"("stockTakeNumber");
CREATE UNIQUE INDEX "StockTake_journalEntryId_key" ON "StockTake"("journalEntryId");
CREATE INDEX "StockTake_warehouseId_idx" ON "StockTake"("warehouseId");
CREATE INDEX "StockTake_status_idx" ON "StockTake"("status");
CREATE INDEX "StockTake_takeDate_idx" ON "StockTake"("takeDate");
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");
CREATE INDEX "ActivityLog_module_idx" ON "ActivityLog"("module");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
CREATE INDEX "ActivityLog_status_idx" ON "ActivityLog"("status");
CREATE INDEX "ScheduledReportRun_scheduledReportId_idx" ON "ScheduledReportRun"("scheduledReportId");
CREATE INDEX "ScheduledReportRun_status_idx" ON "ScheduledReportRun"("status");
CREATE INDEX "ScheduledReportRun_runAt_idx" ON "ScheduledReportRun"("runAt");
CREATE INDEX "ChartOfAccount_parentId_idx" ON "ChartOfAccount"("parentId");
CREATE UNIQUE INDEX "Asset_code_key" ON "Asset"("code");
CREATE INDEX "Asset_glAccountId_idx" ON "Asset"("glAccountId");
CREATE INDEX "Asset_accumDepAccountId_idx" ON "Asset"("accumDepAccountId");
CREATE INDEX "Asset_depExpenseAccountId_idx" ON "Asset"("depExpenseAccountId");
CREATE INDEX "Asset_deletedAt_idx" ON "Asset"("deletedAt");
CREATE UNIQUE INDEX "Cheque_chequeNo_key" ON "Cheque"("chequeNo");
CREATE INDEX "Cheque_bankAccountId_idx" ON "Cheque"("bankAccountId");
CREATE INDEX "Cheque_paymentId_idx" ON "Cheque"("paymentId");
CREATE INDEX "Cheque_journalEntryId_idx" ON "Cheque"("journalEntryId");
CREATE UNIQUE INDEX "CreditNote_creditNoteNo_key" ON "CreditNote"("creditNoteNo");
CREATE INDEX "CreditNote_customerId_idx" ON "CreditNote"("customerId");
CREATE INDEX "CreditNote_invoiceId_idx" ON "CreditNote"("invoiceId");
CREATE INDEX "CreditNote_journalEntryId_idx" ON "CreditNote"("journalEntryId");
CREATE INDEX "CreditNote_deletedAt_idx" ON "CreditNote"("deletedAt");
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");
CREATE UNIQUE INDEX "Customer_externalRefId_key" ON "Customer"("externalRefId");
CREATE INDEX "Customer_deletedAt_idx" ON "Customer"("deletedAt");
CREATE UNIQUE INDEX "DebitNote_debitNoteNo_key" ON "DebitNote"("debitNoteNo");
CREATE INDEX "DebitNote_vendorId_idx" ON "DebitNote"("vendorId");
CREATE INDEX "DebitNote_invoiceId_idx" ON "DebitNote"("invoiceId");
CREATE INDEX "DebitNote_journalEntryId_idx" ON "DebitNote"("journalEntryId");
CREATE INDEX "DebitNote_deletedAt_idx" ON "DebitNote"("deletedAt");
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");
CREATE UNIQUE INDEX "Employee_externalRefId_key" ON "Employee"("externalRefId");
CREATE INDEX "Employee_deletedAt_idx" ON "Employee"("deletedAt");
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");
CREATE INDEX "Invoice_journalEntryId_idx" ON "Invoice"("journalEntryId");
CREATE INDEX "Invoice_createdById_idx" ON "Invoice"("createdById");
CREATE INDEX "Invoice_deletedAt_idx" ON "Invoice"("deletedAt");
CREATE INDEX "Invoice_currencyId_idx" ON "Invoice"("currencyId");
CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");
CREATE INDEX "InvoiceLine_productId_idx" ON "InvoiceLine"("productId");
CREATE UNIQUE INDEX "JournalEntry_entryNo_key" ON "JournalEntry"("entryNo");
CREATE UNIQUE INDEX "JournalEntry_idempotencyKey_key" ON "JournalEntry"("idempotencyKey");
CREATE INDEX "JournalEntry_createdById_idx" ON "JournalEntry"("createdById");
CREATE INDEX "JournalEntry_approvedById_idx" ON "JournalEntry"("approvedById");
CREATE INDEX "JournalEntry_reversingId_idx" ON "JournalEntry"("reversingId");
CREATE INDEX "JournalEntry_deletedAt_idx" ON "JournalEntry"("deletedAt");
CREATE INDEX "JournalLine_entryId_idx" ON "JournalLine"("entryId");
CREATE INDEX "JournalLine_accountId_idx" ON "JournalLine"("accountId");
CREATE UNIQUE INDEX "Payment_paymentNo_key" ON "Payment"("paymentNo");
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
CREATE INDEX "Payment_vendorId_idx" ON "Payment"("vendorId");
CREATE INDEX "Payment_bankAccountId_idx" ON "Payment"("bankAccountId");
CREATE INDEX "Payment_journalEntryId_idx" ON "Payment"("journalEntryId");
CREATE INDEX "Payment_deletedAt_idx" ON "Payment"("deletedAt");
CREATE INDEX "Payment_currencyId_idx" ON "Payment"("currencyId");
CREATE INDEX "PaymentAllocation_paymentId_idx" ON "PaymentAllocation"("paymentId");
CREATE INDEX "PaymentAllocation_invoiceId_idx" ON "PaymentAllocation"("invoiceId");
CREATE UNIQUE INDEX "PayrollRun_runNo_key" ON "PayrollRun"("runNo");
CREATE INDEX "PayrollRun_journalEntryId_idx" ON "PayrollRun"("journalEntryId");
CREATE UNIQUE INDEX "PettyCashFund_code_key" ON "PettyCashFund"("code");
CREATE INDEX "PettyCashFund_custodianId_idx" ON "PettyCashFund"("custodianId");
CREATE INDEX "PettyCashFund_glAccountId_idx" ON "PettyCashFund"("glAccountId");
CREATE UNIQUE INDEX "PettyCashVoucher_voucherNo_key" ON "PettyCashVoucher"("voucherNo");
CREATE INDEX "PettyCashVoucher_fundId_idx" ON "PettyCashVoucher"("fundId");
CREATE INDEX "PettyCashVoucher_journalEntryId_idx" ON "PettyCashVoucher"("journalEntryId");
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");
CREATE UNIQUE INDEX "PurchaseInvoice_invoiceNo_key" ON "PurchaseInvoice"("invoiceNo");
CREATE INDEX "PurchaseInvoice_vendorId_idx" ON "PurchaseInvoice"("vendorId");
CREATE INDEX "PurchaseInvoice_journalEntryId_idx" ON "PurchaseInvoice"("journalEntryId");
CREATE INDEX "PurchaseInvoice_createdById_idx" ON "PurchaseInvoice"("createdById");
CREATE INDEX "PurchaseInvoice_deletedAt_idx" ON "PurchaseInvoice"("deletedAt");
CREATE INDEX "PurchaseInvoiceLine_purchaseId_idx" ON "PurchaseInvoiceLine"("purchaseId");
CREATE UNIQUE INDEX "Receipt_receiptNo_key" ON "Receipt"("receiptNo");
CREATE UNIQUE INDEX "Receipt_idempotencyKey_key" ON "Receipt"("idempotencyKey");
CREATE INDEX "Receipt_customerId_idx" ON "Receipt"("customerId");
CREATE INDEX "Receipt_bankAccountId_idx" ON "Receipt"("bankAccountId");
CREATE INDEX "Receipt_journalEntryId_idx" ON "Receipt"("journalEntryId");
CREATE INDEX "Receipt_deletedAt_idx" ON "Receipt"("deletedAt");
CREATE INDEX "Receipt_currencyId_idx" ON "Receipt"("currencyId");
CREATE INDEX "ReceiptAllocation_receiptId_idx" ON "ReceiptAllocation"("receiptId");
CREATE INDEX "ReceiptAllocation_invoiceId_idx" ON "ReceiptAllocation"("invoiceId");
CREATE UNIQUE INDEX "StockBalance_productId_warehouseId_key" ON "StockBalance"("productId", "warehouseId");
CREATE INDEX "StockMovement_productId_idx" ON "StockMovement"("productId");
CREATE INDEX "StockMovement_warehouseId_idx" ON "StockMovement"("warehouseId");
CREATE INDEX "StockMovement_referenceId_idx" ON "StockMovement"("referenceId");
CREATE INDEX "StockTakeLine_stockTakeId_idx" ON "StockTakeLine"("stockTakeId");
CREATE INDEX "StockTakeLine_productId_idx" ON "StockTakeLine"("productId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "UserSession_sessionToken_key" ON "UserSession"("sessionToken");
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");
CREATE INDEX "UserSession_sessionToken_idx" ON "UserSession"("sessionToken");
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");
CREATE INDEX "UserSession_isValid_idx" ON "UserSession"("isValid");
CREATE INDEX "VatRecord_type_taxMonth_taxYear_idx" ON "VatRecord"("type", "taxMonth", "taxYear");
CREATE INDEX "WithholdingTax_type_taxMonth_taxYear_idx" ON "WithholdingTax"("type", "taxMonth", "taxYear");
CREATE INDEX "AccountingPeriod_status_idx" ON "AccountingPeriod"("status");
CREATE UNIQUE INDEX "AccountingPeriod_year_month_key" ON "AccountingPeriod"("year", "month");
CREATE UNIQUE INDEX "Currency_code_key" ON "Currency"("code");
CREATE INDEX "ExchangeRate_fromCurrency_toCurrency_date_idx" ON "ExchangeRate"("fromCurrency", "toCurrency", "date");
CREATE INDEX "ExchangeRate_date_idx" ON "ExchangeRate"("date");
CREATE INDEX "ExchangeRate_currencyId_idx" ON "ExchangeRate"("currencyId");
CREATE INDEX "CurrencyGainLoss_type_date_idx" ON "CurrencyGainLoss"("type", "date");
CREATE INDEX "CurrencyGainLoss_documentType_documentId_idx" ON "CurrencyGainLoss"("documentType", "documentId");
CREATE INDEX "TaxFormLine_taxFormId_idx" ON "TaxFormLine"("taxFormId");
CREATE INDEX "Budget_year_idx" ON "Budget"("year");
CREATE UNIQUE INDEX "Budget_year_accountId_key" ON "Budget"("year", "accountId");
CREATE UNIQUE INDEX "Entity_code_key" ON "Entity"("code");
CREATE INDEX "InterCompanyTransaction_fromEntityId_idx" ON "InterCompanyTransaction"("fromEntityId");
CREATE INDEX "InterCompanyTransaction_toEntityId_idx" ON "InterCompanyTransaction"("toEntityId");
CREATE INDEX "InterCompanyTransaction_documentType_documentId_idx" ON "InterCompanyTransaction"("documentType", "documentId");
CREATE INDEX "WebhookDelivery_webhookId_idx" ON "WebhookDelivery"("webhookId");
CREATE INDEX "WebhookDelivery_deliveredAt_idx" ON "WebhookDelivery"("deliveredAt");
CREATE INDEX "WebhookDelivery_event_idx" ON "WebhookDelivery"("event");
CREATE INDEX "ApiRequestLog_timestamp_idx" ON "ApiRequestLog"("timestamp");
CREATE INDEX "ApiRequestLog_userId_idx" ON "ApiRequestLog"("userId");
CREATE INDEX "ApiRequestLog_path_idx" ON "ApiRequestLog"("path");
CREATE INDEX "ApiRequestLog_statusCode_idx" ON "ApiRequestLog"("statusCode");
CREATE INDEX "ApiRequestLog_apiVersion_idx" ON "ApiRequestLog"("apiVersion");
CREATE INDEX "RateLimitLog_identifier_endpoint_windowStart_idx" ON "RateLimitLog"("identifier", "endpoint", "windowStart");
CREATE INDEX "RateLimitLog_blocked_idx" ON "RateLimitLog"("blocked");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
CREATE INDEX "AuditLog_hash_idx" ON "AuditLog"("hash");
CREATE UNIQUE INDEX "CsrfToken_token_key" ON "CsrfToken"("token");
CREATE INDEX "CsrfToken_token_idx" ON "CsrfToken"("token");
CREATE INDEX "CsrfToken_sessionId_idx" ON "CsrfToken"("sessionId");
CREATE INDEX "CsrfToken_expiresAt_idx" ON "CsrfToken"("expiresAt");
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");
CREATE INDEX "SavedFilter_userId_idx" ON "SavedFilter"("userId");
CREATE INDEX "SavedFilter_module_idx" ON "SavedFilter"("module");
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "RecentItem_userId_idx" ON "RecentItem"("userId");
CREATE INDEX "RecentItem_module_idx" ON "RecentItem"("module");
CREATE INDEX "RecentItem_accessedAt_idx" ON "RecentItem"("accessedAt");
CREATE UNIQUE INDEX "RecentItem_userId_module_recordId_key" ON "RecentItem"("userId", "module", "recordId");
CREATE INDEX "DocumentLock_module_recordId_idx" ON "DocumentLock"("module", "recordId");
CREATE INDEX "DocumentLock_userId_idx" ON "DocumentLock"("userId");
CREATE INDEX "DocumentLock_expiresAt_idx" ON "DocumentLock"("expiresAt");
CREATE UNIQUE INDEX "DocumentLock_module_recordId_key" ON "DocumentLock"("module", "recordId");
CREATE INDEX "ActivityFeed_module_idx" ON "ActivityFeed"("module");
CREATE INDEX "ActivityFeed_createdAt_idx" ON "ActivityFeed"("createdAt");
CREATE INDEX "ActivityFeed_userId_idx" ON "ActivityFeed"("userId");
CREATE INDEX "StockTransfer_fromWarehouseId_idx" ON "StockTransfer"("fromWarehouseId");
CREATE INDEX "StockTransfer_toWarehouseId_idx" ON "StockTransfer"("toWarehouseId");
CREATE INDEX "Vendor_deletedAt_idx" ON "Vendor"("deletedAt");
COMMIT;
