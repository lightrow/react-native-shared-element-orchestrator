import React, { FC, ReactNode, useCallback, useMemo, useState } from 'react';
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

const SharedTransitionOrchestrator: FC<ISharedTransitionOrchestratorProps> = ({
	children,
	style,
	duration = 500,
	easing = Easing.out(Easing.exp),
	useNativeDriver = true,
}) => {
	const [state, setState] = useState<{
		scenes: ISharedTransitionScene[];
		transitions: ISharedTransition[];
		activeScenesIds: Array<ISharedTransitionScene['id']>;
	}>({
		scenes: [],
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
			setState((state) => {
				const sceneIdx = state.scenes.findIndex(
					(stateScene) => stateScene.id === sceneId
				);
				if (sceneIdx === -1) {
					return state;
				}
				const updatedScenes = [...state.scenes];
				updatedScenes.splice(sceneIdx, 1);
				return {
					...state,
					scenes: updatedScenes,
					activeScenesIds: state.activeScenesIds.filter(
						(activeSceneId) => activeSceneId !== sceneId
					),
				};
			});
		},
		[]
	);

	const onSceneUpdated = useCallback((scene: ISharedTransitionScene) => {
		setState((state) => {
			const sceneIdx = state.scenes.findIndex(
				(stateScene) => stateScene.id === scene.id
			);
			const updatedScenes = [...state.scenes];
			if (sceneIdx === -1) {
				updatedScenes.push(scene);
			} else {
				updatedScenes[sceneIdx] = scene;
			}
			return {
				...state,
				scenes: updatedScenes,
			};
		});
	}, []);

	const onSceneActivated = useCallback(
		(sceneId: ISharedTransitionScene['id']) => {
			setState((state) => {
				const prevScene = state.scenes.find(
					(scene) =>
						scene.id === state.activeScenesIds[state.activeScenesIds.length - 1]
				);
				const nextScene = state.scenes.find((scene) => scene.id === sceneId);
				const transitions =
					prevScene && nextScene && runTransitions(prevScene, nextScene);

				return {
					...state,
					...(transitions && { transitions }),
					activeScenesIds: [...state.activeScenesIds, sceneId],
				};
			});
		},
		[]
	);

	const onSceneDeactivated = useCallback(
		(sceneId: ISharedTransitionScene['id']) => {
			setState((state) => {
				const prevScene = state.scenes.find(
					(scene) =>
						scene.id === state.activeScenesIds[state.activeScenesIds.length - 1]
				);
				const nextScene = state.scenes.find(
					(scene) =>
						scene.id === state.activeScenesIds[state.activeScenesIds.length - 2]
				);
				const transitions =
					prevScene && nextScene && runTransitions(prevScene, nextScene);

				return {
					...state,
					...(transitions && { transitions }),
					activeScenesIds: state.activeScenesIds.filter(
						(activeSceneId) => activeSceneId !== sceneId
					),
				};
			});
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
							progress: Animated.subtract(1, progress),
							sceneId: prevScene.id,
						},
						end: {
							ancestor: nextScene.ancestor,
							node: nextSceneMatchingElement.node,
							progress: progress,
							sceneId: nextScene.id,
						},
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

			return transitions;
		},
		[]
	);

	const context: ISharedTransitionContext = useMemo(() => {
		return {
			onSceneActivated,
			onSceneDeactivated,
			onSceneDestroyed,
			onSceneUpdated,
			scenes: state.scenes,
			transitions: state.transitions,
		};
	}, [
		onSceneActivated,
		onSceneDeactivated,
		onSceneDestroyed,
		onSceneUpdated,
		state.scenes,
		state.transitions,
	]);

	return (
		<SharedTransitionContext.Provider value={context}>
			{children}
			{!!state.transitions.length && (
				<View style={[styles.container, style]} pointerEvents='box-only'>
					{state.transitions.map((transition) => (
						<SharedElementTransition
							start={{
								node: transition.start.node,
								ancestor: transition.start.ancestor,
							}}
							end={{
								node: transition.end.node,
								ancestor: transition.end.ancestor,
							}}
							position={transition.end.progress}
							key={transition.start.sceneId + transition.end.sceneId}
							animation='move'
							resize='auto'
							align='auto'
						/>
					))}
				</View>
			)}
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
