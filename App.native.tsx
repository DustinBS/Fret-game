// App.native.tsx
import "./global.css";
import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import FretboardGame from './src/components/FretboardGame';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <FretboardGame />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}