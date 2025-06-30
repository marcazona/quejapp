import { useEffect } from 'react';
import { Platform } from 'react-native';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

import { Platform } from 'react-native';

export function useFrameworkReady() {
  useEffect(() => {
    // Only call frameworkReady on web platform
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.frameworkReady?.();
    }
  }
  )
  // Only execute framework ready logic on web platform
  if (Platform.OS === 'web') {
    console.log('useFrameworkReady: Executing for web platform');
    // Framework ready logic here
  } else {
    console.log('useFrameworkReady: Skipping for native platform');
  }
}