// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App.jsx'
// import './index.css'

// ReactDOM.createRoot(document.getElementById('root')).render(
//     <React.StrictMode>
//         <App />
//     </React.StrictMode>,
// )

// src/main.jsx (o index.js dependiendo de tu configuración)
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App';
// import { NotificationProvider } from './contexts/NotificationContext';
// import './index.css';

// ReactDOM.createRoot(document.getElementById('root')).render(
//     <React.StrictMode>
//         <NotificationProvider>
//             <App />
//         </NotificationProvider>
//     </React.StrictMode>
// );

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import './index.css';
import './styles/ConnectionAnimations.css';
import { TelegramNotificationProvider } from './components/toolbar/Notification';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TelegramNotificationProvider>
      <App />
    </TelegramNotificationProvider>
  </React.StrictMode>
);