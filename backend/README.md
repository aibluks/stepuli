# Optional backend SQL source

These SQL files preserve the prototype schema, access hardening, verification queries and rollback-based authorization test. The local web app does not connect to a hosted database. No hosted project ID, client configuration, account screenshot, database credential or deployment evidence is included.

This directory is source for a developer to review against their own Supabase environment, not an automatic deployment. `schema-draft.sql` creates tables and policies. `access-hardening.sql` references the platform's `public.rls_auto_enable()` function and must only be used where that function exists. `test-rls-rollback.sql` inserts synthetic fixtures inside a transaction and rolls them back. Do not interpret these files as evidence that your own hosted database is configured or tested.
