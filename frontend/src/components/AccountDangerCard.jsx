export function AccountDangerCard({ isLoading, onDeleteAccount }) {
  return (
    <section className="card danger-card">
      <h3 className="card-title">Delete account</h3>
      <p className="card-copy">
        This removes the authenticated account and clears the linked onboarding
        profile.
      </p>
      <button
        type="button"
        className="danger-button"
        disabled={isLoading}
        onClick={onDeleteAccount}
      >
        {isLoading ? "Deleting account..." : "Delete account"}
      </button>
    </section>
  );
}
