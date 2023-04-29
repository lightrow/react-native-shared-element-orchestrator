import React, {
	FC,
	ReactNode,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
} from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { SharedElement, SharedElementNode } from 'react-native-shared-element';
import { ISharedTransitionElement } from './model';
import { useSharedTransition } from './SharedTransitionContext';
import SharedTransitionSceneContext from './SharedTransitionSceneContext';

interface ISharedElementSceneProps {
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
	containerStyle?: StyleProp<ViewStyle>;
	isActive?: boolean;
	id?: string;
	sceneInterpolator?: (
		progress: Animated.AnimatedInterpolation<number>
	) => Animated.AnimatedProps<ViewStyle>;
}

const SharedTransitionScene: FC<ISharedElementSceneProps> = ({
	children,
	style,
	containerStyle,
	isActive,
	id: propId,
	sceneInterpolator,
}) => {
	const ancestorRef = useRef<SharedElementNode | null>(null);
	const elementsRef = useRef<ISharedTransitionElement[]>([]);
	const id = propId || useId();

	const {
		onSceneUpdated,
		onSceneDestroyed,
		onSceneActivated,
		onSceneDeactivated,
		activeScenesIds,
		transitions,
	} = useSharedTransition();

	const onElementUpdated = useCallback((element: ISharedTransitionElement) => {
		const elementIdx = elementsRef.current.findIndex(
			(el) => el.id === element.id
		);
		if (elementIdx === -1) {
			elementsRef.current.push(element);
		} else {
			elementsRef.current[elementIdx] = element;
		}
		updateScene();
	}, []);

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

	const onAncestorNodeChanged = (ancestor: SharedElementNode | null) => {
		ancestorRef.current = ancestor;
		updateScene();
	};

	const updateScene = () => {
		if (!ancestorRef.current) {
			onSceneDestroyed(id);
			return;
		}
		onSceneUpdated({
			ancestor: ancestorRef.current,
			elements: elementsRef.current,
			id,
		});
	};

	useEffect(() => {
		if (isActive) {
			onSceneActivated(id);
		} else {
			onSceneDeactivated(id);
		}
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

	const startTransition = transitions.find(
		(transitions) => transitions.start.sceneId === id
	)?.start;
	const endTransition = transitions.find(
		(transitions) => transitions.end.sceneId === id
	)?.end;

	return (
		<SharedElement onNode={onAncestorNodeChanged} style={[style]}>
			<Animated.View
				style={[
					startTransition && sceneInterpolator?.(startTransition.progress),
					endTransition && sceneInterpolator?.(endTransition.progress),
					containerStyle,
				]}
			>
				<SharedTransitionSceneContext.Provider value={context}>
					{children}
				</SharedTransitionSceneContext.Provider>
			</Animated.View>
		</SharedElement>
	);
};

export default SharedTransitionScene;
