function formatTimestamp(value) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function SummaryItem({ label, value }) {
  return (
    <div className="summary-item">
      <dt className="summary-label">{label}</dt>
      <dd className="summary-value">{value}</dd>
    </div>
  );
}

export function ProfileSummaryCard({ user, profile }) {
  return (
    <section className="card summary-card">
      <h3 className="card-title">Profile stored</h3>
      <p className="card-copy">
        Authentication is complete and the onboarding profile exists in the
        profiles table.
      </p>
      <dl className="summary-list">
        <SummaryItem label="Auth user id" value={profile.id} />
        <SummaryItem label="Email" value={user.email ?? "Unavailable"} />
        <SummaryItem label="Name" value={profile.name} />
        <SummaryItem label="Username" value={profile.username} />
        <SummaryItem label="Date of birth" value={profile.dob} />
        <SummaryItem
          label="Created at"
          value={formatTimestamp(profile.created_at)}
        />
      </dl>
    </section>
  );
}
