import React, {Dispatch, FC, SetStateAction, useRef, useState} from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {
  Gesture,
  GestureDetector,
  ScrollView,
} from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  SharedTransitionElement,
  SharedTransitionScene,
} from 'react-native-shared-element-orchestrator';
import {IState} from './App';

interface IGalleryViewerProps {
  state: IState;
  setState: Dispatch<SetStateAction<IState>>;
}

const GalleryViewer: FC<IGalleryViewerProps> = ({state, setState}) => {
  const windowWidth = Dimensions.get('window').width;

  const [shouldDismiss, setShouldDismiss] = useState(false);
  const [startingOffset] = useState(
    state.images.findIndex(i => i === state.selectedImage) * windowWidth,
  );

  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {translateX: offsetX.value},
        {translateY: offsetY.value},
        {
          scale: interpolate(
            Math.sqrt(
              Math.pow(Math.abs(offsetX.value), 2) +
                Math.pow(Math.abs(offsetY.value), 2),
            ),
            [0, 100],
            [1, 0.8],
          ),
        },
      ],
    };
  }, []);

  const dismiss = () => {
    setShouldDismiss(true);
    setTimeout(() => {
      setState(s => ({...s, selectedImage: null}));
    }, 500);
  };

  const updateSelected = (ev: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pageIdx = Math.floor(
      ev.nativeEvent.contentOffset.x / windowWidth + 0.5,
    );
    if (state.images[pageIdx] !== state.selectedImage) {
      setState(s => ({...s, selectedImage: state.images[pageIdx]}));
    }
  };

  const gesture = Gesture.Pan()
    .onChange(ev => {
      offsetX.value = ev.translationX;
      offsetY.value = ev.translationY;
    })
    .activeOffsetY([-20, 20])
    .onEnd(() => {
      if (Math.abs(offsetX.value) > 100 || Math.abs(offsetY.value) > 100) {
        runOnJS(dismiss)();
      } else {
        offsetX.value = withSpring(0);
        offsetY.value = withSpring(0);
      }
    });

  return (
    <SharedTransitionScene
      isActive={!shouldDismiss}
      style={styles.scene}
      sceneInterpolator={progress => ({
        opacity: progress,
      })}
      containerStyle={styles.sceneContainer}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[animStyle, {height: '100%', width: '100%'}]}>
          <ScrollView
            contentOffset={{
              x: startingOffset,
              y: 0,
            }}
            scrollEventThrottle={8}
            onScroll={updateSelected}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContainer}
            pagingEnabled
            horizontal>
            {state.images.map(img => (
              <SharedTransitionElement
                key={img}
                id={img === state.selectedImage ? img : 'dummy'}
                style={styles.imgContainer}>
                <FastImage
                  source={{uri: img}}
                  style={styles.img}
                  resizeMode="contain"
                />
              </SharedTransitionElement>
            ))}
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </SharedTransitionScene>
  );
};

export default GalleryViewer;

const styles = StyleSheet.create({
  scene: {
    ...StyleSheet.absoluteFillObject,
  },
  sceneContainer: {backgroundColor: 'black'},
  scroll: {height: '100%', width: '100%'},
  scrollContainer: {
    flexGrow: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  imgContainer: {
    width: Dimensions.get('window').width,
    height: '100%',
  },
  img: {width: '100%', height: '100%'},
});
