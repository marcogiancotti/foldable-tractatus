export default function App() {
  return (
    <div className="app-root">
      <div className="panel-col">
        <div className="panel-sticky">{/* control panel (C4) */}</div>
      </div>
      <main className="reading-col">{/* reading column (C2) */}</main>
      <div className="note-rail" aria-hidden="true" />
    </div>
  );
}
