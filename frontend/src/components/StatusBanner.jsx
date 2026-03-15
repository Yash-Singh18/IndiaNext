export function StatusBanner({ message, tone = "info" }) {
  return <div className={`status-banner status-${tone}`}>{message}</div>;
}
