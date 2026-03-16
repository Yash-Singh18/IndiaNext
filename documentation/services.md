# Services

## Frontend Services

### `src/services/auth/authService.js`

- Reads the current session.
- Starts Google OAuth sign-in.
- Starts email magic-link sign-in.
- Signs the user out.
- Subscribes to auth state changes.

### `src/services/chat/chatService.js`

- Manages the live chat connection used by the popup assistant and full chat page.
- Emits streaming tokens, sources, transcript, audio, and connection state events.

### `src/services/chat/useChat.js`

- Exposes shared React state for chat messages, connection status, and streaming output.
- Keeps chat UI components thin by centralizing send, connect, disconnect, and reset behavior.

### `src/services/profile/profileService.js`

- Loads the authenticated user profile from `public.profiles`.
- Validates `name`, `username`, and `dob` before saving.
- Creates or updates the profile row keyed by the auth user id.

### `src/services/supabase/client.js`

- Creates and caches the browser Supabase client.
- Keeps Supabase access out of UI components.
