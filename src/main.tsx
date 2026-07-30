import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

/*
  Drop the build-time prerendered copy of the book (vite/prerender.ts) before
  React mounts. An inline script in index.html already hid it before first paint,
  so this is not about the flash — it is about not leaving 526 duplicated
  statements in the DOM, where they would show up in the accessibility tree and
  in find-in-page. Absent in dev and in tests, hence the optional chaining.
*/
document.getElementById('prerender')?.remove();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
