# Priority 2 Functions - Quick Reference

**Quick lookup for database operators and SREs**

---

## Function Signatures

```sql
-- Delete user and all related data
delete_user_cascade(p_user_id TEXT) RETURNS BOOLEAN

-- Clean up old webhook events
cleanup_old_processed_events(p_days_old INT = 30) RETURNS TABLE(deleted_count INT)

-- Detect orphaned cv_versions
detect_orphaned_cv_versions() RETURNS TABLE(orphaned_count INT, affected_sessions INT)
```

---

## Quick Usage

### Delete a User
```sql
SELECT delete_user_cascade('usr_123');
-- Returns: TRUE (success) or FALSE (error)
```

### Clean Up Old Events
```sql
SELECT cleanup_old_processed_events();        -- Keep 30 days
SELECT cleanup_old_processed_events(60);      -- Keep 60 days
SELECT cleanup_old_processed_events(7);       -- Keep 7 days
-- Returns: deleted_count
```

### Check for Orphans
```sql
SELECT * FROM detect_orphaned_cv_versions();
-- Returns: orphaned_count, affected_sessions
```

---

## Monitoring Queries

### Table Size Before/After Cleanup
```sql
-- Before
SELECT COUNT(*) as event_count FROM processed_events;

-- Run cleanup
SELECT cleanup_old_processed_events(30);

-- After
SELECT COUNT(*) as event_count FROM processed_events;
```

### Orphan Status
```sql
SELECT * FROM detect_orphaned_cv_versions();
-- Expected: orphaned_count > 0 is normal
```

### Verify Functions Exist
```sql
\df delete_user_cascade
\df cleanup_old_processed_events
\df detect_orphaned_cv_versions
```

---

## Common Operations

### Cleanup Schedule Check
```sql
SELECT * FROM cron.job WHERE jobname = 'cleanup-processed-events';
```

### View Recent Deletions (if logging enabled)
```sql
SELECT * FROM audit_log WHERE operation = 'DELETE' LIMIT 10;
```

### Check User Cascade Safety
```sql
-- Verify cascades exist
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name IN ('sessions', 'messages', 'cv_versions', 'resume_targets')
  AND column_name LIKE '%_id';
```

---

## Troubleshooting

### "Function does not exist"
```sql
-- Verify migration was applied
\df

-- If missing, apply migration:
psql $DATABASE_URL < prisma/migrations/20260331_priority_2_operational_improvements.sql
```

### Cleanup Deleted Nothing
```sql
-- Check if events are old enough
SELECT COUNT(*) FROM processed_events
WHERE created_at < NOW() - INTERVAL '30 days';
-- If 0, all events are recent (expected)
```

### User Deletion Failed
```sql
-- Check if user exists
SELECT * FROM users WHERE id = 'usr_123';

-- Check for FK constraint issues
SELECT constraint_name, table_name, column_name
FROM information_schema.constraint_column_usage
WHERE table_name = 'users';
```

---

## Performance Notes

| Operation | Time | Frequency |
|-----------|------|-----------|
| delete_user_cascade() | ~20ms | On-demand |
| cleanup_old_processed_events() | ~100ms | Daily |
| detect_orphaned_cv_versions() | ~50ms | Quarterly |

---

## Alert Thresholds

### Cleanup Job
- ⚠️ Alert if `deleted_count = 0` for 7 days
- ⚠️ Alert if `deleted_count > 10000` per run
- ℹ️ Track `deleted_count` trend (should be stable)

### Orphan Detection
- ℹ️ `orphaned_count > 0` is expected
- ℹ️ Growing gradually is normal
- ⚠️ Alert only if growing exponentially

---

## Integration Points

### TypeScript
```typescript
const { data } = await supabaseAdmin.rpc('delete_user_cascade', {
  p_user_id: 'usr_123'
})
```

### cron Endpoint
```
GET /api/cron/cleanup?token=CRON_SECRET
```

### pg_cron
```sql
SELECT cron.schedule('cleanup', '0 2 * * *',
  'SELECT cleanup_old_processed_events(30)');
```

---

## Documentation Links

- **Full Details**: docs/priority-2-operations-guide.md
- **Deployment**: docs/DEPLOYMENT_PRIORITY_2.md
- **Tests**: docs/priority-2-operations-guide.md (test scenarios section)
- **Architecture**: CLAUDE.md, SCHEMA_REVIEW.md

---

## Support

For issues or questions:
1. Check SCHEMA_REVIEW.md Priority 2 section
2. Review priority-2-operations-guide.md (test scenarios)
3. Contact database team
