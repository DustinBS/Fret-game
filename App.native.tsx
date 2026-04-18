// App.native.tsx
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import { KEY_CONSTRAINT_OPTIONS } from './src/utils/musicTheory';
import { useGlobalKeyConstraint } from './src/hooks/useGlobalKey.native';
import { readSessionBoolean, writeSessionBoolean } from './src/utils/viewState';
import FretboardGame from './src/components/FretboardGame.native';
import SandboxMode from './src/components/SandboxMode.native';
import ChordQuizMode from './src/components/ChordQuizMode.native';
import GalleryMode from './src/components/GalleryMode.native';
import VisualArchetypeMode from './src/components/VisualArchetypeMode.native';
import type { GalleryJumpRequest, ShapePresetRequest } from './src/types/nativeNavigation';

type NativeTab = 'TRAINER' | 'SANDBOX' | 'QUIZ' | 'GALLERY' | 'VISUAL_ARCHETYPE';

const TAB_LABELS: Record<NativeTab, string> = {
  TRAINER: 'Trainer',
  SANDBOX: 'Sandbox',
  QUIZ: 'Quiz',
  GALLERY: 'Gallery',
  VISUAL_ARCHETYPE: 'Visual Archetype',
};

const TAB_SHORT_LABELS: Record<NativeTab, string> = {
  TRAINER: 'TR',
  SANDBOX: 'SB',
  QUIZ: 'QZ',
  GALLERY: 'GL',
  VISUAL_ARCHETYPE: 'VA',
};

const GALLERY_COLORS_KEY = 'fret-gallery-colors-native';
const SIDEBAR_COLLAPSE_KEY = 'fret-native-sidebar-collapsed';

const TAB_ORDER: NativeTab[] = ['TRAINER', 'SANDBOX', 'QUIZ', 'GALLERY', 'VISUAL_ARCHETYPE'];

function NativeMenuButton({
  tab,
  active,
  collapsed,
  onPress,
}: {
  tab: NativeTab;
  active: boolean;
  collapsed: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.sideButton, active ? styles.sideButtonActive : null, collapsed ? styles.sideButtonCollapsed : null]}
    >
      <Text style={[styles.sideButtonText, active ? styles.sideButtonTextActive : null]}>
        {collapsed ? TAB_SHORT_LABELS[tab] : TAB_LABELS[tab]}
      </Text>
    </Pressable>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NativeTab>('TRAINER');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readSessionBoolean(SIDEBAR_COLLAPSE_KEY, false));
  const [globalKey, setGlobalKey] = useGlobalKeyConstraint('C');
  const [useGalleryColors, setUseGalleryColors] = useState<boolean>(() => readSessionBoolean(GALLERY_COLORS_KEY, true));
  const [mountedTabs, setMountedTabs] = useState<Record<NativeTab, boolean>>({
    TRAINER: true,
    SANDBOX: false,
    QUIZ: false,
    GALLERY: false,
    VISUAL_ARCHETYPE: false,
  });
  const [sandboxPresetRequest, setSandboxPresetRequest] = useState<{ id: number; preset: ShapePresetRequest } | null>(null);
  const [galleryScrollRequest, setGalleryScrollRequest] = useState<{ id: number; quality: string; chordId?: string } | null>(null);

  useEffect(() => {
    writeSessionBoolean(GALLERY_COLORS_KEY, useGalleryColors);
  }, [useGalleryColors]);

  useEffect(() => {
    writeSessionBoolean(SIDEBAR_COLLAPSE_KEY, sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    const lockOrientation = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch {
        // Keep app usable even if orientation APIs are unavailable.
      }
    };

    void lockOrientation();

    return () => {
      ScreenOrientation.unlockAsync().catch(() => {
        // Ignore unlock failures on teardown.
      });
    };
  }, []);

  const activateTab = (tab: NativeTab) => {
    setActiveTab(tab);
    setMountedTabs((prev) => (prev[tab] ? prev : { ...prev, [tab]: true }));
  };

  const openSandboxFromShape = (request: ShapePresetRequest) => {
    setSandboxPresetRequest({ id: Date.now(), preset: request });
    activateTab('SANDBOX');
  };

  const openGalleryFromSandbox = (request: GalleryJumpRequest) => {
    if (KEY_CONSTRAINT_OPTIONS.includes(request.key)) {
      setGlobalKey(request.key);
    }

    setGalleryScrollRequest({ id: Date.now(), quality: request.quality, chordId: request.chordId });
    activateTab('GALLERY');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={[styles.sideRail, sidebarCollapsed ? styles.sideRailCollapsed : null]}>
            <View style={styles.sideRailHeader}>
              {!sidebarCollapsed ? <Text style={styles.sideRailTitle}>Modes</Text> : null}
              <Pressable
                onPress={() => setSidebarCollapsed((prev) => !prev)}
                style={styles.sideRailChevronButton}
                hitSlop={8}
              >
                <Text style={styles.sideRailChevronText}>{sidebarCollapsed ? '>' : '<'}</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.sideRailList} contentContainerStyle={styles.sideRailListContent}>
              {TAB_ORDER.map((tab) => (
                <NativeMenuButton
                  key={tab}
                  tab={tab}
                  collapsed={sidebarCollapsed}
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

            {mountedTabs.SANDBOX ? (
              <View style={[styles.screenLayer, { display: activeTab === 'SANDBOX' ? 'flex' : 'none' }]}>
                <SandboxMode
                  presetRequest={sandboxPresetRequest}
                  onOpenGallery={openGalleryFromSandbox}
                  keyConstraint={globalKey}
                />
              </View>
            ) : null}

            {mountedTabs.QUIZ ? (
              <View style={[styles.screenLayer, { display: activeTab === 'QUIZ' ? 'flex' : 'none' }]}>
                <ChordQuizMode />
              </View>
            ) : null}

            {mountedTabs.GALLERY ? (
              <View style={[styles.screenLayer, { display: activeTab === 'GALLERY' ? 'flex' : 'none' }]}>
                <GalleryMode
                  keyConstraint={globalKey}
                  useGalleryColors={useGalleryColors}
                  onToggleGalleryColors={() => setUseGalleryColors((prev) => !prev)}
                  onChangeKeyConstraint={setGlobalKey}
                  onOpenSandbox={openSandboxFromShape}
                  scrollRequest={galleryScrollRequest}
                />
              </View>
            ) : null}

            {mountedTabs.VISUAL_ARCHETYPE ? (
              <View style={[styles.screenLayer, { display: activeTab === 'VISUAL_ARCHETYPE' ? 'flex' : 'none' }]}>
                <VisualArchetypeMode
                  keyConstraint={globalKey}
                  useGalleryColors={useGalleryColors}
                  onToggleGalleryColors={() => setUseGalleryColors((prev) => !prev)}
                  onChangeKeyConstraint={setGlobalKey}
                  onOpenSandbox={openSandboxFromShape}
                />
              </View>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  sideRail: {
    width: 190,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
  },
  sideRailCollapsed: {
    width: 64,
    paddingHorizontal: 6,
  },
  sideRailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sideRailTitle: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sideRailChevronButton: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideRailChevronText: {
    color: '#1e293b',
    fontSize: 11,
    fontWeight: '900',
    marginTop: -1,
  },
  sideRailList: {
    flex: 1,
  },
  sideRailListContent: {
    gap: 6,
    paddingBottom: 6,
  },
  sideButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButtonCollapsed: {
    paddingHorizontal: 0,
  },
  sideButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  sideButtonText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  sideButtonTextActive: {
    color: '#1d4ed8',
  },
  contentArea: {
    flex: 1,
    position: 'relative',
  },
  screenLayer: {
    ...StyleSheet.absoluteFillObject,
  },
});