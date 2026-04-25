import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import { UIProvider } from './shared/context/ui-context';
import { AuthProvider } from './shared/context/auth-context';
import { DraftsProvider } from './shared/context/drafts-context';
import './tailwind.css';
import './style.css';

ReactDOM.createRoot(document.querySelector<HTMLDivElement>('#app')!).render(
  <React.StrictMode>
    <UIProvider>
      <BrowserRouter>
        <AuthProvider>
          <DraftsProvider>
            <App />
          </DraftsProvider>
        </AuthProvider>
      </BrowserRouter>
    </UIProvider>
  </React.StrictMode>,
);
