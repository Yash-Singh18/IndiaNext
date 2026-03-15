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
      AuthHeader.jsx
      HeroPanel.jsx
      ProfileFormCard.jsx
      ProfileSummaryCard.jsx
      StatusBanner.jsx
    pages/
      home/
        index.js
    services/
      auth/
        authService.js
      config/
        runtimeConfigService.js
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
  filestructure.md
  instructions.md
  schemas.md
  services.md
```
