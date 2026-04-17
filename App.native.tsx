// App.native.tsx
import "./global.css";
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import FretboardGame from './src/components/FretboardGame';

type NativeTab = 'TRAINER' | 'SANDBOX' | 'QUIZ' | 'GALLERY' | 'VISUAL_ARCHETYPE';

const WEB_APP_BASE_URL = 'https://dustinbs.github.io/Fret-game/';

const TAB_LABELS: Record<NativeTab, string> = {
  TRAINER: 'Trainer',
  SANDBOX: 'Sandbox',
  QUIZ: 'Quiz',
  GALLERY: 'Gallery',
  VISUAL_ARCHETYPE: 'Visual Archetype',
};

const WEB_TAB_QUERY: Record<Exclude<NativeTab, 'TRAINER'>, string> = {
  SANDBOX: 'sandbox',
  QUIZ: 'quiz',
  GALLERY: 'gallery',
  VISUAL_ARCHETYPE: 'visualarchetype',
};

const TAB_ORDER: NativeTab[] = ['TRAINER', 'SANDBOX', 'QUIZ', 'GALLERY', 'VISUAL_ARCHETYPE'];

function NativeTabButton({
  tab,
  active,
  onPress,
}: {
  tab: NativeTab;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, active ? styles.tabButtonActive : styles.tabButtonInactive]}
    >
      <Text style={[styles.tabButtonText, active ? styles.tabButtonTextActive : styles.tabButtonTextInactive]}>
        {TAB_LABELS[tab]}
      </Text>
    </Pressable>
  );
}

function EmbeddedWebMode({ tab }: { tab: Exclude<NativeTab, 'TRAINER'> }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [hasLoadError, setHasLoadError] = useState(false);
  const uri = useMemo(() => `${WEB_APP_BASE_URL}?tab=${WEB_TAB_QUERY[tab]}`, [tab]);

  if (hasLoadError) {
    return (
      <View style={styles.webFallbackContainer}>
        <Text style={styles.webFallbackTitle}>Could not load {TAB_LABELS[tab]}</Text>
        <Text style={styles.webFallbackBody}>Check network connectivity and try again.</Text>
        <Pressable
          onPress={() => {
            setHasLoadError(false);
            setReloadKey((value) => value + 1);
          }}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <WebView
      key={`${tab}-${reloadKey}`}
      source={{ uri }}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.webLoadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.webLoadingText}>Loading {TAB_LABELS[tab]}...</Text>
        </View>
      )}
      onError={() => setHasLoadError(true)}
      onHttpError={() => setHasLoadError(true)}
      javaScriptEnabled
      domStorageEnabled
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      setSupportMultipleWindows={false}
      style={styles.webView}
    />
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NativeTab>('TRAINER');
  const [mountedTabs, setMountedTabs] = useState<Record<NativeTab, boolean>>({
    TRAINER: true,
    SANDBOX: false,
    QUIZ: false,
    GALLERY: false,
    VISUAL_ARCHETYPE: false,
  });

  const activateTab = (tab: NativeTab) => {
    setActiveTab(tab);
    setMountedTabs((prev) => (prev[tab] ? prev : { ...prev, [tab]: true }));
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <View style={styles.container}>
          <View style={styles.navBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navScrollContent}>
              {TAB_ORDER.map((tab) => (
                <NativeTabButton
                  key={tab}
                  tab={tab}
                  active={activeTab === tab}
                  onPress={() => activateTab(tab)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.contentArea}>
            <View style={[styles.screenLayer, { display: activeTab === 'TRAINER' ? 'flex' : 'none' }]}>
              <FretboardGame />
            </View>

            {(['SANDBOX', 'QUIZ', 'GALLERY', 'VISUAL_ARCHETYPE'] as const).map((tab) => {
              if (!mountedTabs[tab]) {
                return null;
              }

              return (
                <View key={tab} style={[styles.screenLayer, { display: activeTab === tab ? 'flex' : 'none' }]}>
                  <EmbeddedWebMode tab={tab} />
                </View>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  navBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  navScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 8,
  },
  tabButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  tabButtonActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  tabButtonInactive: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  tabButtonText: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  tabButtonTextInactive: {
    color: '#475569',
  },
  contentArea: {
    flex: 1,
    position: 'relative',
  },
  screenLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  webView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  webLoadingText: {
    color: '#475569',
    fontWeight: '600',
  },
  webFallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
    backgroundColor: '#ffffff',
  },
  webFallbackTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  webFallbackBody: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 13,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 11,
  },
});