import React, { Dispatch, FC, SetStateAction } from 'react';
import { FlatList, Image, StyleSheet } from 'react-native';
import {
	SharedTransitionElement,
	SharedTransitionScene,
} from 'react-native-shared-element-orchestrator';
import { IState } from './App';
import Touchable from './Touchable';

interface IGallerySliderProps {
	state: IState;
	setState: Dispatch<SetStateAction<IState>>;
}

const GallerySlider: FC<IGallerySliderProps> = ({ setState, state }) => {
	return (
		<SharedTransitionScene
			style={styles.container}
			containerStyle={styles.container}
			isActive
		>
			<FlatList
				data={state.images}
				numColumns={2}
				getItemLayout={(item, index) => ({
					index,
					length: 200,
					offset: 200 * index,
				})}
				renderItem={({ item: img }) => {
					return (
						<Touchable
							style={styles.button}
							onPress={() => setState((s) => ({ ...s, selectedImage: img }))}
						>
							<SharedTransitionElement style={styles.imgContainer} id={img}>
								<Image
									key={'img' + img}
									style={styles.img}
									source={{ uri: img, cache: 'force-cache' }}
									resizeMode='cover'
									borderRadius={15}
								/>
							</SharedTransitionElement>
						</Touchable>
					);
				}}
				style={styles.scroll}
				contentContainerStyle={styles.scrollContainer}
			></FlatList>
		</SharedTransitionScene>
	);
};

export default GallerySlider;

const styles = StyleSheet.create({
	container: { flex: 1 },
	scroll: { flex: 1, backgroundColor: '#eee', width: '100%' },
	scrollContainer: {
		padding: 5,
	},
	button: { width: '50%', height: 200, padding: 5 },
	imgContainer: { width: '100%', height: '100%' },
	img: {
		width: '100%',
		height: '100%',
	},
});
