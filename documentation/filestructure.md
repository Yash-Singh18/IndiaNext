# File Structure

## Frontend

```text
frontend/
  index.html
  package.json
  src/
    components/
      AccountDangerCard.jsx
      AuthChoiceModal.jsx
      ChatInput.jsx
      ChatMessage.jsx
      ChatPanel.css
      ChatPanel.jsx
      ProfileFormCard.jsx
      ProfileSetupModal.css
      ProfileSetupModal.jsx
      ProfileSummaryCard.jsx
      StatusBanner.jsx
    pages/
      chat/
        ChatPage.css
        ChatPage.jsx
      home/
        HomePage.css
        HomePage.jsx
      landing/
        LandingPage.css
        LandingPage.jsx
    services/
      auth/
        authService.js
      chat/
        chatService.js
        useChat.js
      profile/
        profileService.js
      supabase/
        client.js
    App.jsx
    main.jsx
    styles.css
```

## Supabase

```text
supabase/
  migrations/
    20260314164411_remote_schema.sql
    20260314223000_create_profiles_table.sql
    20260315000000_add_delete_own_account.sql
```

## Documentation

```text
documentation/
  colorpallete.md
  filestructure.md
  instructions.md
  schemas.md
  services.md
```
