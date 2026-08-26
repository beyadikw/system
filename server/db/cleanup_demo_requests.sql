-- شغّل هذا الملف مرة واحدة على قاعدة البيانات الحيّة لحذف الطلبات التجريبية
-- التي أدخلها seed.sql سابقاً (قبل تعطيل AUTO_SEED)، مع الحفاظ التام على
-- BK-1042 و BK-1001 (الطلبات الفعلية) وأي تقرير مرفوع فعلياً.
USE khudh_biyadi;

SET @demo_ids = "'BK-1041','BK-1040','BK-1039','BK-1037','BK-1031'";

DELETE FROM attachments        WHERE request_id IN ('BK-1041','BK-1040','BK-1039','BK-1037','BK-1031');
DELETE FROM reports            WHERE request_id IN ('BK-1041','BK-1040','BK-1039','BK-1037','BK-1031');
DELETE FROM request_categories WHERE request_id IN ('BK-1041','BK-1040','BK-1039','BK-1037','BK-1031');
DELETE FROM requests           WHERE id         IN ('BK-1041','BK-1040','BK-1039','BK-1037','BK-1031');

-- تحقّق: يجب ألا يظهر إلا BK-1042 و BK-1001 (وأي طلب حقيقي أضفتموه لاحقاً)
SELECT id, event_name, organization, status FROM requests ORDER BY id;
