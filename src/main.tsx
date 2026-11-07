import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/vazirmatn/index.css';
import './styles/immersive.css';
import App from './App';
import { prepareNavigation } from './immersive/navigationStartup';

prepareNavigation();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
