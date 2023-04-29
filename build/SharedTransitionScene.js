import { useCallback, useEffect, useId, useMemo, useRef, } from 'react';
import { Animated } from 'react-native';
import { SharedElement } from 'react-native-shared-element';
import { useSharedTransition } from './SharedTransitionContext';
import SharedTransitionSceneContext from './SharedTransitionSceneContext';
const SharedTransitionScene = ({ children, style, containerStyle, isActive, id: propId, animateScene, }) => {
    var _a, _b;
    const ancestorRef = useRef(null);
    const elementsRef = useRef([]);
    const id = propId || useId();
    const { onSceneUpdated, onSceneDestroyed, onSceneActivated, onSceneDeactivated, transitions, } = useSharedTransition();
    const onElementUpdated = useCallback((element) => {
        const elementIdx = elementsRef.current.findIndex((el) => el.id === element.id);
        if (elementIdx === -1) {
            elementsRef.current.push(element);
        }
        else {
            elementsRef.current[elementIdx] = element;
        }
        updateScene();
    }, []);
    const onElementDestroyed = useCallback((elementId) => {
        const elementIdx = elementsRef.current.findIndex((el) => el.id === elementId);
        if (elementIdx === -1) {
            return;
        }
        elementsRef.current.splice(elementIdx, 1);
        updateScene();
    }, []);
    const onAncestorNodeChanged = (ancestor) => {
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
        }
        else {
            onSceneDeactivated(id);
        }
    }, [isActive]);
    useEffect(() => {
        return () => {
            onSceneDestroyed(id);
        };
    }, []);
    const context = useMemo(() => ({ onElementDestroyed, onElementUpdated }), [onElementDestroyed, onElementUpdated]);
    const startTransition = (_a = transitions.find((transitions) => transitions.start.sceneId === id)) === null || _a === void 0 ? void 0 : _a.start;
    const endTransition = (_b = transitions.find((transitions) => transitions.end.sceneId === id)) === null || _b === void 0 ? void 0 : _b.end;
    return (<SharedElement onNode={onAncestorNodeChanged} style={[style]}>
			<Animated.View style={[
            startTransition &&
                animateScene && {
                opacity: startTransition.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                }),
            },
            endTransition &&
                animateScene && {
                opacity: endTransition.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                }),
            },
            containerStyle,
        ]}>
				<SharedTransitionSceneContext.Provider value={context}>
					{children}
				</SharedTransitionSceneContext.Provider>
			</Animated.View>
		</SharedElement>);
};
export default SharedTransitionScene;
