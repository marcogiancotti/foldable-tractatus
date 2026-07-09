import ReadingColumn from './components/ReadingColumn';

export default function App() {
  return (
    <div className="app-root">
      <div className="panel-col">
        <div className="panel-sticky">{/* control panel (C4) */}</div>
      </div>
      <ReadingColumn />
      <div className="note-rail" aria-hidden="true" />
    </div>
  );
}
