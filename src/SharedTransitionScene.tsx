import React, {
	FC,
	ReactNode,
	memo,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
} from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { SharedElement, SharedElementNode } from 'react-native-shared-element';
import { ISharedTransitionElement, ISharedTransitionScene } from './model';
import { useSharedTransition } from './SharedTransitionContext';
import SharedTransitionSceneContext from './SharedTransitionSceneContext';
import { useUpdateEffect, useUpdatedRef } from './utils/hooks';

interface ISharedElementSceneProps {
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
	containerStyle?: StyleProp<ViewStyle>;
	isActive?: boolean;
	sceneInterpolator?: (
		progress: Animated.AnimatedInterpolation<number>
	) => Animated.AnimatedProps<ViewStyle>;
}

const SharedTransitionScene: FC<ISharedElementSceneProps> = memo(
	({
		children,
		style,
		containerStyle,
		isActive = false,
		sceneInterpolator,
	}) => {
		const ancestorRef = useRef<SharedElementNode | null>(null);
		const elementsRef = useRef<ISharedTransitionElement[]>([]);
		const id = useId();
		const isActiveRef = useUpdatedRef(isActive);

		const { onSceneUpdated, onSceneDestroyed, scenes } = useSharedTransition();

		const onElementUpdated = useCallback(
			(element: ISharedTransitionElement) => {
				const elementIdx = elementsRef.current.findIndex(
					(el) => el.id === element.id
				);
				if (elementIdx === -1) {
					elementsRef.current.push(element);
				} else {
					elementsRef.current[elementIdx] = element;
				}
				updateScene();
			},
			[]
		);

		const onElementDestroyed = useCallback(
			(elementId: ISharedTransitionElement['id']) => {
				const elementIdx = elementsRef.current.findIndex(
					(el) => el.id === elementId
				);
				if (elementIdx === -1) {
					return;
				}
				elementsRef.current.splice(elementIdx, 1);
				updateScene();
			},
			[]
		);

		const onAncestorNodeChanged = useCallback(
			(ancestor: SharedElementNode | null) => {
				ancestorRef.current = ancestor;
				updateScene();
			},
			[]
		);

		const updateScene = useCallback(() => {
			if (!ancestorRef.current) {
				return;
			}
			onSceneUpdated({
				ancestor: ancestorRef.current,
				elements: elementsRef.current,
				isActive: isActiveRef.current,
				id,
			} as ISharedTransitionScene);
		}, []);

		useUpdateEffect(() => {
			updateScene();
		}, [isActive]);

		useEffect(() => {
			return () => {
				onSceneDestroyed(id);
			};
		}, []);

		const context = useMemo(
			() => ({ onElementDestroyed, onElementUpdated }),
			[onElementDestroyed, onElementUpdated]
		);

		const animStyle = useMemo(() => {
			const sceneProgress = scenes[id]?.progress;
			if (sceneInterpolator && sceneProgress) {
				return sceneInterpolator(sceneProgress);
			}
		}, [scenes[id]?.progress, sceneInterpolator]);

		return (
			<SharedElement onNode={onAncestorNodeChanged} style={[style]}>
				<Animated.View style={[animStyle, containerStyle]}>
					<SharedTransitionSceneContext.Provider value={context}>
						{children}
					</SharedTransitionSceneContext.Provider>
				</Animated.View>
			</SharedElement>
		);
	}
);

export default SharedTransitionScene;
