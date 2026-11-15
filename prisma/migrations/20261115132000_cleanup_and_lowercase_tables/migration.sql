-- 1. Drop unused legacy & orphan tables (child tables first)
DROP TABLE IF EXISTS "mt5_import_attempts" CASCADE;
DROP TABLE IF EXISTS "mt5_batches" CASCADE;
DROP TABLE IF EXISTS "mt5_raw_orders" CASCADE;
DROP TABLE IF EXISTS "mt5_raw_deals" CASCADE;
DROP TABLE IF EXISTS "mt5_enrollment_tokens" CASCADE;
DROP TABLE IF EXISTS "mt5_workers" CASCADE;
DROP TABLE IF EXISTS "account_notifications" CASCADE;
DROP TABLE IF EXISTS "Challenge" CASCADE;
DROP TABLE IF EXISTS "UserFollow" CASCADE;
DROP TABLE IF EXISTS "partners" CASCADE;
DROP TABLE IF EXISTS "support_sync_tickets" CASCADE;

-- 2. Rename all 35 PascalCase tables to lowercase snake_case (zero data loss)
DO $$
DECLARE
  pair RECORD;
BEGIN
  FOR pair IN
    SELECT * FROM (VALUES
      ('User', 'users'),
      ('TradingDayNote', 'trading_day_notes'),
      ('Profile', 'profiles'),
      ('Level', 'levels'),
      ('Module', 'modules'),
      ('Lesson', 'lessons'),
      ('UserProgress', 'user_progress'),
      ('Article', 'articles'),
      ('ArticleVote', 'article_votes'),
      ('Category', 'categories'),
      ('Tag', 'tags'),
      ('ArticleTag', 'article_tags'),
      ('JournalEntry', 'journal_entries'),
      ('EconomicEvent', 'economic_events'),
      ('Quiz', 'quizzes'),
      ('Question', 'questions'),
      ('Option', 'options'),
      ('UserQuizAttempt', 'user_quiz_attempts'),
      ('Certificate', 'certificates'),
      ('Comment', 'comments'),
      ('ErrorLog', 'error_logs'),
      ('Media', 'media'),
      ('SystemSetting', 'system_settings'),
      ('Badge', 'badges'),
      ('UserBadge', 'user_badges'),
      ('EALicense', 'ea_licenses'),
      ('EAProduct', 'ea_products'),
      ('EADownload', 'ea_downloads'),
      ('Notification', 'notifications'),
      ('AdminBroadcast', 'admin_broadcasts'),
      ('AuditLog', 'audit_logs'),
      ('UserSession', 'user_sessions'),
      ('Feedback', 'feedbacks'),
      ('ToolView', 'tool_views'),
      ('Quote', 'quotes')
    ) AS t(old_name, new_name)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name = pair.old_name
    ) THEN
      EXECUTE format('ALTER TABLE public.%I RENAME TO %I', pair.old_name, pair.new_name);
    END IF;
  END LOOP;
END $$;
