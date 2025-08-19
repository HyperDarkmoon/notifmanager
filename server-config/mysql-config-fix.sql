-- MySQL Configuration Fix for Large Packet Support
-- Run these commands on your MySQL server to fix the packet size issue

-- Set max_allowed_packet to 16MB (should be enough for base64 encoded videos)
SET GLOBAL max_allowed_packet = 16777216;

-- Make the change permanent by adding to my.cnf/my.ini:
-- [mysqld]
-- max_allowed_packet = 16M

-- Verify the setting
SHOW VARIABLES LIKE 'max_allowed_packet';
