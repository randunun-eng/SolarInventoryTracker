-- Migration: Import data from Replit
-- This migration imports all data extracted from the Replit database

-- Import Categories
-- Note: We're using INSERT OR REPLACE to handle potential conflicts
INSERT OR REPLACE INTO categories (id, name, description) VALUES
  (1, 'Voltage regulator', ''),
  (3, 'MOSFET', ''),
  (4, 'IGBT', ''),
  (5, 'OPTO COUPLER', ''),
  (6, 'RESISTER', ''),
  (7, 'TRANSISTER', ''),
  (8, 'IC', ''),
  (9, 'CAPACITOR', ''),
  (10, 'INDUCTOR', ''),
  (11, 'MOV', '');

-- Import Suppliers
INSERT OR REPLACE INTO suppliers (id, name, contact_name, email, phone, address, website, remarks, tags) VALUES
  (1, 'Shenzhen Jiexinda Semiconductor Techn 深圳市捷信达半导体科技', '', '', '', NULL, 'https://item.taobao.com/item.htm?_u=61v4ni556201&id=632256914992&pisk=gEQUszwWbyUEAKJpxNTr05rSFGTp-UybEa9WZ_fkOpv32Baoz_5DNWe89GRlFOF89e1kUTW6B4O7v83PQ91cAH65ALAkIOfIRLap4T5fHTg7JMOozO1JqT_Pw4RlZTFpFWE196LJr-wfzr1d9nmJcHbetC0G6QhnxltnYP5Q1-wblzrnsUyUhTgyG7aMgIYkt30ls5RvGQYkq3Yg_QASK00hE5PwaQJoq4vHsFAWwUmkK3xiSIRet4mnxhVwwdvkrUXkS5R-a5bfzPO2x7iUB5D7LotBn6vZrqD9LH2AT0gSPOOHYnEpI4x17B-en6bq7xP6sN_wchG7CFfAf9AwuykvTGf2-Q78i0Jy4wLwQtzmyCIhLNxP57UV6eRymUxZZ4fwSLxVWE4mQCIGOgbdLbuk9w_X4KKaZ4KWSZtcm9l8M1YHZTKAP-3pK_fAkiT48xdFjs8N4TkJsREFyMko4HA9_KNa_6I8cih0tvp-20KLTCJb9Xm-2HA9_KNa_0nJv9RwhWhh.&spm=a1z09.2.0.0.38ee2e8dQnES0M', '7912 taobao supplier
60T65', '["MOSFET","IGBT"]'),
  (2, 'Shenzhen Youxin Electronic Technology Co., Ltd. 深圳市优信电子科技有', '', '', '', NULL, 'https://shop131282813.taobao.com/?spm=pc_detail.29232929.shop_block.dshopinfo.17e27dd6Iwv8l4', '78M05
SMD', '["SMD CAPACITOR","SMD"]'),
  (3, 'Jili Electronics Co., Ltd 集利电子商行', '', '', '', NULL, 'https://shop114858868.taobao.com/shop/view_shop.htm?spm=a1z09.2.0.0.5ed72e8d7rWwCT&user_number_id=2306339489', '15T14', '["MOSFET","IGBT"]'),
  (4, 'Shenzhen Futian District Yuansheng Elec 深圳市福田区源升电子商行', '', '', '', NULL, 'https://shop128560588.taobao.com/shop/view_shop.htm?spm=a1z09.2.0.0.4fd92e8dj8FrzU&user_number_id=2616909141', '075N15', '["MOSFET"]'),
  (5, 'Shenzhen Huangcheng Electronics Co. 深圳市煌城电子有限公司', '', '', '', NULL, 'https://shop423575501.taobao.com/?spm=pc_detail.29232929.shop_block.dshopinfo.fa567dd6ufmVax', 'CS10N50F', '["MOSFET"]');

-- Import Clients
INSERT OR REPLACE INTO clients (id, name, email, phone, address) VALUES
  (1, 'Solaris pvt ltd-Lahiru', '', '0742224298', 'wellawatta'),
  (2, 'Dumith Rupasinghe', '', '0718734604', 'Mahalwarawa'),
  (3, 'Sarath Ranasingha', '', '0779266015', 'Pitakotte'),
  (4, 'Nuwan Lions Technology', '', '0776203765', 'Galle'),
  (5, 'Nishantha Jayasooriya', '', '0722928627', 'Pannipitiya near Nursing home '),
  (6, 'Pamod Nilru', '', '0717252854', ''),
  (7, 'Dhanushka Sub', '', '0774357946', ''),
  (8, 'Lakmal Ranasinghe', '', '+94777246778', 'Mahamegawatta road, maharagama');

-- Import Fault Types
INSERT OR REPLACE INTO fault_types (id, name, description) VALUES
  (1, 'error 52', NULL),
  (2, 'Battery side short', NULL),
  (3, 'Battery voltage error', NULL),
  (4, 'No power', NULL),
  (5, 'Error 09', NULL),
  (6, 'Output Voltage adnormal ', NULL),
  (7, 'Error 03', NULL),
  (8, 'MPPT voltage error', NULL);

-- Import Components
INSERT OR REPLACE INTO components (id, name, part_number, category_id, description, datasheet, image, location, minimum_stock, current_stock, supplier_price, supplier_id, last_purchase_date) VALUES
  (1, 'L7912CV', 'TO-220', 1, '-12vdc', '/uploads/1747823598545-308667059.PDF', '/uploads/1747823589020-157466578.gif', 'Pannipitiya', 5, 23, 0.5, 1, NULL),
  (2, '78M05', 'TO-252', 1, '+5 VDC', '/uploads/1747823834918-454229137.PDF', '/uploads/1747823827907-509088809.jpg', 'Pannipitiya', 5, 10, 0.4, 2, NULL),
  (3, 'NCEP 15T14', 'TO-220', 3, '140A
150V', '/uploads/1747823623512-659060933.PDF', '/uploads/1747823693916-626339931.png', 'Pannipitiya', 18, 39, 1.9, NULL, NULL),
  (4, 'NCEP 85T25', 'TO-220', 3, '85V 250A', '/uploads/1747823725964-597358238.pdf', '/uploads/1747823796120-864807059.jpg', 'Pannipitiya', 10, 20, 0.5, 3, NULL),
  (5, 'NCEP 028N85', 'TO-220', 3, '85V 200A', '/uploads/1747823972827-551008549.pdf', '/uploads/1747823967827-76918435.jpg', 'Pannipitiya', 18, 40, 0.5, 3, NULL),
  (6, 'MAGNACHIP 60T65PES', 'TO-247', 4, '60A 
650V', '/uploads/1747823932079-682183351.PDF', '/uploads/1747823937534-153047572.png', 'Pannipitiya', 10, 32, 1.3, 1, NULL),
  (7, 'FDP 075N15A', 'TO-220', 3, '150V 130A', '/uploads/1747823898590-527809834.PDF', '/uploads/1747823904473-619747772.png', 'Pannipitiya', 5, 11, 0.6, 4, NULL),
  (8, 'CS10N50F', 'TO-220F', 3, '500V
10A', '/uploads/1747823862357-296724169.pdf', '/uploads/1747823869709-31121399.jpg', 'Pannipitiya', 5, 10, 0.4, 5, NULL);
