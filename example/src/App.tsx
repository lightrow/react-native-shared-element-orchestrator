import React, {useEffect, useState} from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import GallerySlider from './GallerySlider';
import GalleryViewer from './GalleryViewer';
import {SharedTransitionOrchestrator} from 'react-native-shared-element-orchestrator';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

export interface IState {
  images: string[];
  selectedImage: string | null;
}

function App(): JSX.Element {
  const [state, setState] = useState<IState>({
    images: [],
    selectedImage: null,
  });

  const getImages = async () => {
    const resp = await fetch('https://nekos.best/api/v2/kitsune?amount=15', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    const data = (await resp.json()) as any;
    setState(s => ({...s, images: data.results.map(r => r.url)}));
  };

  useEffect(() => {
    getImages();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <SharedTransitionOrchestrator style={styles.container}>
          <GallerySlider state={state} setState={setState} />
          {state.selectedImage && (
            <GalleryViewer state={state} setState={setState} />
          )}
        </SharedTransitionOrchestrator>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
