import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
} from '@expo-google-fonts/archivo';
import {
  ChivoMono_400Regular,
  ChivoMono_500Medium,
  ChivoMono_700Bold,
} from '@expo-google-fonts/chivo-mono';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '@/lib/queryClient';

// Anchor the tab navigator as the stack's base route. Opening a pushed screen
// directly — a deep link, a web refresh, or Fast Refresh landing on /story/[id] —
// then still has the feed beneath it, so Back has somewhere to go instead of
// dispatching an unhandled GO_BACK.
export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    ChivoMono_400Regular,
    ChivoMono_500Medium,
    ChivoMono_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#faf9f5' } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="story/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="campaign/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="campaign-goal" options={{ presentation: 'card' }} />
              <Stack.Screen name="campaign-brief" options={{ presentation: 'card' }} />
              <Stack.Screen name="newsletter-chat" options={{ presentation: 'card' }} />
              <Stack.Screen name="report-story/[storyId]" options={{ presentation: 'card' }} />
              <Stack.Screen name="report-tracker/[trackerId]" options={{ presentation: 'card' }} />
              <Stack.Screen name="recipient-group/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="newsletter-bucket/[bucketId]" options={{ presentation: 'card' }} />
              <Stack.Screen name="newsletter-keyword-group/[groupId]" options={{ presentation: 'card' }} />
              <Stack.Screen name="newsletter-sendout/[sendoutId]" options={{ presentation: 'card' }} />
              <Stack.Screen name="client-report/[reportId]" options={{ presentation: 'card' }} />
              <Stack.Screen name="persona/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="usage" options={{ presentation: 'card' }} />
              <Stack.Screen name="account-info" options={{ presentation: 'card' }} />
              <Stack.Screen name="subscription" options={{ presentation: 'card' }} />
              <Stack.Screen name="release-notes" options={{ presentation: 'card' }} />
            </Stack>
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
