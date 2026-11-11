import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const root = document.getElementById('checker-root')!;
const resultHost = document.getElementById('result-root')!;
root.innerHTML = '';
createRoot(root).render(
  <StrictMode>
    <App resultHost={resultHost} />
  </StrictMode>,
);
