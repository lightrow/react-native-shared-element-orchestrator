import React, {Dispatch, FC, SetStateAction} from 'react';
import {Pressable, ScrollView, StyleSheet} from 'react-native';
import FastImage from 'react-native-fast-image';
import {
  SharedTransitionElement,
  SharedTransitionScene,
} from 'react-native-shared-element-orchestrator';
import {IState} from './App';
import Touchable from './Touchable';

interface IGallerySliderProps {
  state: IState;
  setState: Dispatch<SetStateAction<IState>>;
}

const GallerySlider: FC<IGallerySliderProps> = ({setState, state}) => {
  return (
    <SharedTransitionScene
      style={styles.container}
      containerStyle={styles.container}
      sceneInterpolator={progress => ({
        transform: [
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [1.5, 1],
            }),
          },
        ],
      })}
      isActive>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}>
        {state.images.map(img => (
          <Touchable
            key={img}
            style={styles.button}
            onPress={() => setState(s => ({...s, selectedImage: img}))}>
            <SharedTransitionElement style={styles.imgContainer} id={img}>
              <FastImage style={styles.img} source={{uri: img}} />
            </SharedTransitionElement>
          </Touchable>
        ))}
      </ScrollView>
    </SharedTransitionScene>
  );
};

export default GallerySlider;

const styles = StyleSheet.create({
  container: {flex: 1},
  scroll: {flex: 1, backgroundColor: '#eee'},
  scrollContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    padding: 5,
  },
  button: {width: '50%', height: 200, padding: 5},
  imgContainer: {width: '100%', height: '100%'},
  img: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
});
