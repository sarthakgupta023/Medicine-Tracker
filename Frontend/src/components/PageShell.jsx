export default function PageShell({ title, subtitle, right, children }) {
  return (
    <div className="page">
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 16,
          background: "linear-gradient(135deg, #2e86de, #5aa7f0)",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>{title}</h2>
            {subtitle ? <p style={{ margin: "4px 0 0", opacity: 0.9 }}>{subtitle}</p> : null}
          </div>
          {right}
        </div>
      </div>
      {children}
    </div>
  );
}
