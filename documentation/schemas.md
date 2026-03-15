# Database Schema Notes

## `public.profiles`

Stores onboarding profile data separately from Supabase Auth.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key. Matches `auth.users.id`. |
| `name` | `text` | Required display name collected after email or Google auth. |
| `username` | `text` | Required unique username. Lowercase letters, numbers, and underscores only. |
| `dob` | `date` | Required date of birth. |
| `created_at` | `timestamptz` | Defaults to current UTC timestamp. |

### Constraints

- `id` references `auth.users(id)` and cascades on delete.
- `username` is unique.
- `username` must match `^[a-z0-9_]{3,24}$`.

### RLS Policies

- Authenticated users can `select` only their own profile row.
- Authenticated users can `insert` only a row whose `id` matches `auth.uid()`.
- Authenticated users can `update` only their own row.

## `public.delete_own_account()`

Security definer RPC that deletes the current authenticated row from `auth.users`.

- Requires an authenticated session.
- Deletes the auth user only when `auth.uid()` is present.
- Cascades to `public.profiles` through the foreign key on `profiles.id`.
