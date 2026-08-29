'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('PWA ServiceWorker registrado con éxito:', registration.scope);
          })
          .catch((err) => {
            console.log('Fallo al registrar ServiceWorker PWA:', err);
          });
      });
    }
  }, []);

  return null;
}
