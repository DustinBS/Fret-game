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
  onPress,
}: {
  tab: NativeTab;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.sideButton, active ? styles.sideButtonActive : null]}
    >
      <Text style={[styles.sideButtonText, active ? styles.sideButtonTextActive : null]}>
        {TAB_LABELS[tab]}
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
          <View style={styles.topNavBar}>
            <ScrollView horizontal style={styles.topNavBarList} contentContainerStyle={styles.topNavBarListContent} showsHorizontalScrollIndicator={false}>
              {TAB_ORDER.map((tab) => (
                <NativeMenuButton
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

            {mountedTabs.SANDBOX ? (
              <View style={[styles.screenLayer, { display: activeTab === 'SANDBOX' ? 'flex' : 'none' }]}>
                <SandboxMode
                  presetRequest={sandboxPresetRequest}
                  onOpenGallery={openGalleryFromSandbox}
                  onOpenVisualArchetype={openVisualArchetypeFromSandbox}
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
                  scrollRequest={visualArchetypeScrollRequest}
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
    flexDirection: 'column',
    backgroundColor: '#ffffff',
  },
  topNavBar: {
    height: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  topNavBarList: {
    flex: 1,
  },
  topNavBarListContent: {
    gap: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    flexDirection: 'row',
  },
  sideButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
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