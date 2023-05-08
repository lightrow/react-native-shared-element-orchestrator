import React, {
	FC,
	ReactNode,
	memo,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from 'react';
import { Animated, StyleProp, View, ViewStyle } from 'react-native';
import { SharedElement, SharedElementNode } from 'react-native-shared-element';
import { useSharedTransition } from './SharedTransitionContext';
import SharedTransitionSceneContext from './SharedTransitionSceneContext';
import { ISharedTransitionElement, ISharedTransitionScene } from './model';

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
		const id = useId();
		const ancestorRef = useRef<SharedElementNode | null>(null);
		const elementsRef = useRef<ISharedTransitionElement[]>([]);
		const [isReadyToDisplay, setIsReadyToDisplay] = useState(false);

		const {
			onSceneUpdated,
			onSceneDestroyed,
			onSceneActivated,
			onSceneDeactivated,
			scenes,
			progresses,
		} = useSharedTransition();

		const updateScene = useCallback(() => {
			if (!ancestorRef.current) {
				return;
			}
			onSceneUpdated({
				ancestor: ancestorRef.current,
				elements: elementsRef.current,
				id,
			} as ISharedTransitionScene);
		}, []);

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

		useEffect(() => {
			setIsReadyToDisplay(true);
			return () => {
				onSceneDestroyed(id);
			};
		}, []);

		useEffect(() => {
			if (isActive && isReadyToDisplay) {
				onSceneActivated(id);
			} else {
				onSceneDeactivated(id);
			}
		}, [isActive, isReadyToDisplay]);

		const context = useMemo(
			() => ({ onElementDestroyed, onElementUpdated }),
			[onElementDestroyed, onElementUpdated]
		);

		const animStyle = (() => {
			if (!isReadyToDisplay) {
				// avoids flash of the final state scene before shared transition starts
				return {
					opacity: 0,
				};
			}
			const sceneProgress = progresses.current?.[id];
			if (sceneInterpolator && sceneProgress) {
				return sceneInterpolator(sceneProgress);
			}
		})();

		return (
			<Animated.View style={[style, animStyle]}>
				<SharedElement onNode={onAncestorNodeChanged} style={style}>
					<View style={containerStyle}>
						<SharedTransitionSceneContext.Provider value={context}>
							{children}
						</SharedTransitionSceneContext.Provider>
					</View>
				</SharedElement>
			</Animated.View>
		);
	}
);

export default SharedTransitionScene;
