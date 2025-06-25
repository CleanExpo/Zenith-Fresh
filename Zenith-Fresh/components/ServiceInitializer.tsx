'use client';

import { useEffect } from 'react';

export default function ServiceInitializer() {
  useEffect(() => {
    // Initialize services on the client side for development
    if (process.env.NODE_ENV === 'development') {
      const initServices = async () => {
        try {
          // Call API endpoint to initialize services
          const response = await fetch('/api/services/initialize', {
            method: 'POST',
          });
          
          if (response.ok) {
            console.log('✅ Services initialized successfully');
          } else {
            console.warn('⚠️ Service initialization response:', response.status);
          }
        } catch (error) {
          console.warn('⚠️ Could not initialize services (this is normal if running without Redis/database):', error);
        }
      };

      // Delay initialization to avoid blocking the UI
      const timer = setTimeout(initServices, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // This component doesn't render anything
  return null;
}