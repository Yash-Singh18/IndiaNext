# Services

## Frontend Services

### `src/services/config/runtimeConfigService.js`

- Loads `frontend/.env` at runtime.
- Normalizes the Supabase URL so a project reference or hostname can still be used.

### `src/services/supabase/client.js`

- Creates and caches the browser Supabase client.
- Keeps Supabase access out of UI components.

### `src/services/auth/authService.js`

- Reads the current session.
- Starts Google OAuth sign-in.
- Starts email magic-link sign-in.
- Signs the user out.
- Deletes the authenticated user through a database RPC.
- Subscribes to auth state changes.

### `src/services/profile/profileService.js`

- Loads the authenticated user profile from `public.profiles`.
- Validates `name`, `username`, and `dob` before saving.
- Creates or updates the profile row keyed by the auth user id.
