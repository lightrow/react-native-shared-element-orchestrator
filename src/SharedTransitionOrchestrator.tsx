import React, {
	FC,
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
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
import { SharedElementTransition } from 'react-native-shared-element';

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
}

interface IState {
	scenes: Record<ISharedTransitionScene['id'], ISharedTransitionScene>;
	transitions: ISharedTransition[];
	activeScenesIds: Array<ISharedTransitionScene['id']>;
}

const SharedTransitionOrchestrator: FC<ISharedTransitionOrchestratorProps> = ({
	children,
	style,
	duration = 500,
	easing = Easing.out(Easing.exp),
	useNativeDriver = true,
}) => {
	const [state, setState] = useState<IState>({
		scenes: {},
		transitions: [],
		activeScenesIds: [],
	});

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
			setState((prevState) => {
				const state = { ...prevState, scenes: { ...prevState.scenes } };
				delete state.scenes[sceneId];
				state.activeScenesIds = state.activeScenesIds.filter(
					(activeSceneId) => activeSceneId !== sceneId
				);
				return state;
			});
		},
		[]
	);

	const onSceneUpdated = useCallback((scene: ISharedTransitionScene) => {
		setState((prevState) => {
			if (scene.isActive && !prevState.activeScenesIds.includes(scene.id)) {
				return activateScene(scene, prevState);
			} else if (
				!scene.isActive &&
				prevState.activeScenesIds.includes(scene.id)
			) {
				return deactivateScene(scene, prevState);
			} else {
				return {
					...prevState,
					scenes: {
						...prevState.scenes,
						[scene.id]: { ...prevState.scenes[scene.id], ...scene },
					},
				};
			}
		});
	}, []);

	const activateScene = useCallback(
		(scene: ISharedTransitionScene, prevState: IState) => {
			const state = {
				...prevState,
				scenes: { ...prevState.scenes },
				activeScenesIds: [...prevState.activeScenesIds, scene.id],
			};

			const nextScene = scene;
			const prevScene =
				state.scenes[
					prevState.activeScenesIds[prevState.activeScenesIds.length - 1]
				];

			if (prevScene) {
				const { progress, transitions } = runTransitions(prevScene, nextScene);
				prevScene.progress = Animated.subtract(1, progress);
				nextScene.progress = progress;
				state.scenes[prevScene.id] = prevScene;
				state.scenes[nextScene.id] = nextScene;
				state.transitions = transitions;
			} else {
				const animation = new Animated.Value(0);
				nextScene.progress = animation;
				state.scenes[scene.id] = nextScene;
				Animated.timing(animation, {
					...animationConfig.current,
					toValue: 1,
				}).start();
			}

			return { ...state };
		},
		[]
	);

	const deactivateScene = useCallback(
		(scene: ISharedTransitionScene, prevState: IState) => {
			const state = {
				...prevState,
				scenes: { ...prevState.scenes },
				activeScenesIds: prevState.activeScenesIds.filter(
					(activeSceneId) => activeSceneId !== scene.id
				),
			};

			const prevScene = scene;
			const prevSceneIdx = prevState.activeScenesIds.findIndex(
				(id) => id === scene.id
			);
			const nextScene =
				state.scenes[prevState.activeScenesIds[prevSceneIdx - 1]];

			if (nextScene) {
				const { progress, transitions } = runTransitions(prevScene, nextScene);
				prevScene.progress = Animated.subtract(1, progress);
				nextScene.progress = progress;
				state.scenes[prevScene.id] = prevScene;
				state.scenes[nextScene.id] = nextScene;
				state.transitions = transitions;
			} else {
				const animation = new Animated.Value(1);
				prevScene.progress = animation;
				state.scenes[prevScene.id] = prevScene;
				Animated.timing(animation, {
					...animationConfig.current,
					toValue: 0,
				}).start();
			}

			return state;
		},
		[]
	);

	const runTransitions = useCallback(
		(prevScene: ISharedTransitionScene, nextScene: ISharedTransitionScene) => {
			const transitions: ISharedTransition[] = [];

			const progress = new Animated.Value(0);

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
						progress,
					});
				}
			});

			const interaction = InteractionManager.createInteractionHandle();
			Animated.timing(progress, {
				toValue: 1,
				...animationConfig.current,
			}).start(() => {
				InteractionManager.clearInteractionHandle(interaction);
				setState((state) => ({ ...state, transitions: [] }));
			});

			return { transitions, progress };
		},
		[]
	);

	const context: ISharedTransitionContext = useMemo(() => {
		return {
			onSceneDestroyed,
			onSceneUpdated,
			scenes: state.scenes,
		};
	}, [onSceneDestroyed, onSceneUpdated, state.scenes]);

	return (
		<SharedTransitionContext.Provider value={context}>
			{children}
			{!!state.transitions.length &&
				state.transitions.map((transition) => (
					<SharedElementTransition
						style={[styles.container, style]}
						start={{
							node: transition.start.node,
							ancestor: transition.start.ancestor,
						}}
						end={{
							node: transition.end.node,
							ancestor: transition.end.ancestor,
						}}
						position={transition.progress}
						key={transition.start.sceneId + transition.end.sceneId}
						animation='move'
						resize='auto'
						align='auto'
					/>
				))}
			{!!state.transitions.length && <View style={styles.touchBlocker} />}
		</SharedTransitionContext.Provider>
	);
};

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
		zIndex: 99999999,
	},
	// disabling touch on SharedElementTransition or its parent has buggy behaviour when finger is held down
	touchBlocker: { ...StyleSheet.absoluteFillObject, zIndex: 99999999 },
});

export default SharedTransitionOrchestrator;
