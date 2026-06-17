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
import type { GalleryJumpRequest, ShapePresetRequest, VisualArchetypeJumpRequest } from './src/types/nativeNavigation';

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
  compact,
  onPress,
}: {
  tab: NativeTab;
  active: boolean;
  compact: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.sideButton,
        compact ? styles.sideButtonCompact : null,
        active ? styles.sideButtonActive : null,
      ]}
    >
      <Text
        style={[
          styles.sideButtonText,
          compact ? styles.sideButtonTextCompact : null,
          active ? styles.sideButtonTextActive : null,
        ]}
      >
        {compact ? TAB_SHORT_LABELS[tab] : TAB_LABELS[tab]}
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
  const [galleryScrollRequest, setGalleryScrollRequest] = useState<{
    id: number;
    quality: string;
    chordId?: string;
    rootString?: number;
    rootVoicing?: string;
    shapeIndex?: number;
  } | null>(null);
  const [visualArchetypeScrollRequest, setVisualArchetypeScrollRequest] = useState<{
    id: number;
    quality: string;
    chordId?: string;
    rootString?: number;
    rootVoicing?: string;
    shapeIndex?: number;
  } | null>(null);

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
    if (request.key && KEY_CONSTRAINT_OPTIONS.includes(request.key)) {
      setGlobalKey(request.key);
    }

    setGalleryScrollRequest({
      id: Date.now(),
      quality: request.quality,
      chordId: request.chordId,
      rootString: request.rootString,
      rootVoicing: request.rootVoicing,
      shapeIndex: request.shapeIndex,
    });
    activateTab('GALLERY');
  };

  const openVisualArchetypeFromSandbox = (request: VisualArchetypeJumpRequest) => {
    if (request.key && KEY_CONSTRAINT_OPTIONS.includes(request.key)) {
      setGlobalKey(request.key);
    }

    setVisualArchetypeScrollRequest({
      id: Date.now(),
      quality: request.quality,
      chordId: request.chordId,
      rootString: request.rootString,
      rootVoicing: request.rootVoicing,
      shapeIndex: request.shapeIndex,
    });
    activateTab('VISUAL_ARCHETYPE');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['right', 'bottom', 'left']}>
        <View style={styles.container}>
          <View style={[styles.sideRail, sidebarCollapsed ? styles.sideRailCollapsed : styles.sideRailExpanded]}>
            <View style={styles.sideRailTopRow}>
              {!sidebarCollapsed ? <Text style={styles.sideRailTitle}>Menu</Text> : null}
              <Pressable
                onPress={() => setSidebarCollapsed((prev) => !prev)}
                style={styles.collapseButton}
                hitSlop={8}
              >
                <Text style={styles.collapseButtonText}>{sidebarCollapsed ? '>' : '<'}</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.sideRailContent} showsVerticalScrollIndicator={false}>
              {TAB_ORDER.map((tab) => (
                <NativeMenuButton
                  key={tab}
                  tab={tab}
                  active={activeTab === tab}
                  compact={sidebarCollapsed}
                  onPress={() => activateTab(tab)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.contentArea}>
            <View style={[styles.screenLayer, { display: activeTab === 'TRAINER' ? 'flex' : 'none' }]}>
              <FretboardGame sidebarCollapsed={sidebarCollapsed} />
            </View>

            {mountedTabs.SANDBOX ? (
              <View style={[styles.screenLayer, { display: activeTab === 'SANDBOX' ? 'flex' : 'none' }]}>
                <SandboxMode
                  presetRequest={sandboxPresetRequest}
                  onOpenGallery={openGalleryFromSandbox}
                  onOpenVisualArchetype={openVisualArchetypeFromSandbox}
                  keyConstraint={globalKey}
                  sidebarCollapsed={sidebarCollapsed}
                />
              </View>
            ) : null}

            {mountedTabs.QUIZ ? (
              <View style={[styles.screenLayer, { display: activeTab === 'QUIZ' ? 'flex' : 'none' }]}>
                <ChordQuizMode sidebarCollapsed={sidebarCollapsed} />
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
                  sidebarCollapsed={sidebarCollapsed}
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
                  scrollRequest={visualArchetypeScrollRequest}
                  sidebarCollapsed={sidebarCollapsed}
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
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  sideRail: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingTop: 10,
    paddingBottom: 10,
  },
  sideRailExpanded: {
    width: 160,
  },
  sideRailCollapsed: {
    width: 56,
  },
  sideRailTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingBottom: 10,
  },
  sideRailTitle: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  collapseButton: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapseButtonText: {
    color: '#1e293b',
    fontSize: 11,
    fontWeight: '900',
    marginTop: -1,
  },
  sideRailContent: {
    gap: 8,
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  sideButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButtonCompact: {
    paddingHorizontal: 0,
    paddingVertical: 10,
  },
  sideButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  sideButtonText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  sideButtonTextCompact: {
    fontSize: 10,
    letterSpacing: 1,
  },
  sideButtonTextActive: {
    color: '#1d4ed8',
  },
  contentArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  screenLayer: {
    ...StyleSheet.absoluteFillObject,
  },
});