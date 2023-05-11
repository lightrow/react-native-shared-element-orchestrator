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
import { useUpdateEffect } from './utils/hooks';
import debounce from './utils/debounce';

interface ISharedElementSceneProps {
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
	containerStyle?: StyleProp<ViewStyle>;
	isActive?: boolean;
	sceneInterpolator?: (
		progress: Animated.AnimatedInterpolation<number>
	) => Animated.AnimatedProps<ViewStyle>;
	mountActivationDebounce?: number;
	onTransitionEnd?: () => void;
}

const SharedTransitionScene: FC<ISharedElementSceneProps> = memo(
	({
		children,
		style,
		containerStyle,
		isActive = false,
		sceneInterpolator,
		mountActivationDebounce = 100,
		onTransitionEnd,
	}) => {
		const id = useId();
		const ancestorRef = useRef<SharedElementNode | null>(null);
		const elementsRef = useRef<ISharedTransitionElement[]>([]);
		const [progress] = useState(new Animated.Value(0));
		const [readyToActivate, setReadyToActivate] = useState(false);

		const {
			onSceneUpdated,
			onSceneDestroyed,
			onSceneActivated,
			onSceneDeactivated,
		} = useSharedTransition();

		const flipReadyToActivate = useCallback(
			debounce(() => {
				setReadyToActivate(true);
			}, mountActivationDebounce),
			[mountActivationDebounce]
		);

		const updateScene = useCallback(() => {
			if (!ancestorRef.current) {
				return;
			}
			onSceneUpdated({
				ancestor: ancestorRef.current,
				elements: elementsRef.current,
				id,
				progress,
				onTransitionEnd,
			});
			flipReadyToActivate();
		}, [onTransitionEnd]);

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
			[updateScene]
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
			[updateScene]
		);

		const onAncestorNodeChanged = useCallback(
			(ancestor: SharedElementNode | null) => {
				ancestorRef.current = ancestor;
				updateScene();
			},
			[]
		);

		useEffect(() => {
			return () => {
				onSceneDestroyed(id);
			};
		}, []);

		useUpdateEffect(() => {
			if (!isActive) {
				onSceneDeactivated(id);
			}
		}, [isActive]);

		useUpdateEffect(() => {
			if (isActive && readyToActivate) {
				onSceneActivated(id);
			}
		}, [isActive, readyToActivate]);

		const context = useMemo(
			() => ({ onElementDestroyed, onElementUpdated, progress }),
			[onElementDestroyed, onElementUpdated]
		);

		const animStyle = (() => {
			if (!readyToActivate) {
				return {
					opacity: 0,
				};
			}
			if (sceneInterpolator) {
				return sceneInterpolator(progress);
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
