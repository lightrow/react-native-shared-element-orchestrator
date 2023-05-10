import React, {
	FC,
	ReactNode,
	useCallback,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	Animated,
	Easing,
	EasingFunction,
	InteractionManager,
	StyleProp,
	StyleSheet,
	View,
	ViewStyle,
} from 'react-native';
import {
	SharedElementAlign,
	SharedElementAnimation,
	SharedElementResize,
	SharedElementTransition,
} from 'react-native-shared-element';

import {
	ISharedTransition,
	ISharedTransitionContext,
	ISharedTransitionScene,
} from './model';
import SharedTransitionContext from './SharedTransitionContext';
import { useUpdatedRef } from './utils/hooks';

export interface ISharedTransitionOrchestratorProps {
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
	duration?: number;
	easing?: EasingFunction;
	useNativeDriver?: boolean;
	animation?: SharedElementAnimation;
	resize?: SharedElementResize;
	align?: SharedElementAlign;
}

interface IState {
	scenes: Record<ISharedTransitionScene['id'], ISharedTransitionScene>;
	activeScenesIds: Array<ISharedTransitionScene['id']>;
}

const SharedTransitionOrchestrator: FC<ISharedTransitionOrchestratorProps> = ({
	children,
	style,
	duration = 500,
	easing = Easing.out(Easing.exp),
	useNativeDriver = true,
	...rest
}) => {
	const [transitions, setTransitions] = useState<ISharedTransition[]>([]);

	const scenesState = useRef<IState>({
		scenes: {},
		activeScenesIds: [],
	}).current;

	const animationConfig = useUpdatedRef(
		{
			duration,
			easing,
			useNativeDriver,
		},
		[duration, easing, useNativeDriver]
	);

	const onSceneDestroyed = useCallback(
		(sceneId: ISharedTransitionScene['id']) => {
			delete scenesState.scenes[sceneId];

			scenesState.activeScenesIds = scenesState.activeScenesIds.filter(
				(activeSceneId) => activeSceneId !== sceneId
			);
		},
		[]
	);

	const onSceneUpdated = useCallback((scene: ISharedTransitionScene) => {
		scenesState.scenes[scene.id] = scene;
	}, []);

	const onSceneActivated = useCallback(
		(sceneId: ISharedTransitionScene['id']) => {
			const nextScene = scenesState.scenes[sceneId];
			const prevScene =
				scenesState.scenes[
					scenesState.activeScenesIds[scenesState.activeScenesIds.length - 1]
				];

			scenesState.activeScenesIds.push(sceneId);

			if (prevScene) {
				runTransitions(prevScene, nextScene);
			} else {
				Animated.timing(nextScene.progress, {
					...animationConfig.current,
					toValue: 1,
				}).start();
			}
		},
		[]
	);

	const onSceneDeactivated = useCallback(
		(sceneId: ISharedTransitionScene['id']) => {
			const prevScene = scenesState.scenes[sceneId];
			const prevSceneIdx = scenesState.activeScenesIds.findIndex(
				(id) => id === sceneId
			);
			const nextScene =
				scenesState.scenes[scenesState.activeScenesIds[prevSceneIdx - 1]];

			scenesState.activeScenesIds.splice(prevSceneIdx, 1);

			if (nextScene) {
				runTransitions(prevScene, nextScene);
			} else {
				Animated.timing(prevScene.progress, {
					...animationConfig.current,
					toValue: 0,
				}).start();
			}
		},
		[]
	);

	const runTransitions = useCallback(
		(prevScene: ISharedTransitionScene, nextScene: ISharedTransitionScene) => {
			const transitions: ISharedTransition[] = [];

			prevScene.elements.forEach((prevSceneElement) => {
				const nextSceneMatchingElement = nextScene.elements.find(
					(nextSceneElement) => prevSceneElement.id === nextSceneElement.id
				);
				if (nextSceneMatchingElement) {
					transitions.push({
						start: {
							ancestor: prevScene.ancestor,
							node: prevSceneElement.node,
							sceneId: prevScene.id,
						},
						end: {
							ancestor: nextScene.ancestor,
							node: nextSceneMatchingElement.node,
							sceneId: nextScene.id,
						},
						progress: nextScene.progress,
						zIndex: nextSceneMatchingElement.zIndex,
					});
				}
			});

			const interaction = InteractionManager.createInteractionHandle();

			Animated.timing(prevScene.progress, {
				toValue: 0,
				...animationConfig.current,
			}).start();
			Animated.timing(nextScene.progress, {
				toValue: 1,
				...animationConfig.current,
			}).start(() => {
				InteractionManager.clearInteractionHandle(interaction);
				setTransitions([]);
			});

			setTransitions(transitions);
		},
		[]
	);

	const context: ISharedTransitionContext = useMemo(() => {
		return {
			onSceneDestroyed,
			onSceneUpdated,
			onSceneActivated,
			onSceneDeactivated,
		};
	}, [onSceneDestroyed, onSceneUpdated, onSceneActivated, onSceneDeactivated]);

	return (
		<SharedTransitionContext.Provider value={context}>
			{children}
			<View style={[styles.container, style]} pointerEvents='box-none'>
				{!!transitions.length &&
					transitions.map((transition, idx) => (
						<SharedElementTransition
							style={[styles.container, { zIndex: transition.zIndex }]}
							start={{
								node: transition.start.node,
								ancestor: transition.start.ancestor,
							}}
							end={{
								node: transition.end.node,
								ancestor: transition.end.ancestor,
							}}
							position={transition.progress}
							key={idx}
							animation='move'
							resize='auto'
							align='auto'
							{...rest}
						/>
					))}
				{!!transitions.length && <View style={styles.container} />}
			</View>
		</SharedTransitionContext.Provider>
	);
};

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
		zIndex: 99999999,
	},
});

export default SharedTransitionOrchestrator;
