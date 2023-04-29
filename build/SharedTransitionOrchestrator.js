import { useCallback, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { SharedElementTransition } from 'react-native-shared-element';
import SharedTransitionContext from './SharedTransitionContext';
const SharedTransitionOrchestrator = ({ children, }) => {
    const [state, setState] = useState({
        scenes: [],
        transitions: [],
        activeScenesIds: [],
    });
    const onSceneDestroyed = useCallback((sceneId) => {
        setState((state) => {
            const sceneIdx = state.scenes.findIndex((stateScene) => stateScene.id === sceneId);
            if (sceneIdx === -1) {
                return state;
            }
            const updatedScenes = [...state.scenes];
            updatedScenes.splice(sceneIdx, 1);
            return Object.assign(Object.assign({}, state), { scenes: updatedScenes, activeScenesIds: state.activeScenesIds.filter((activeSceneId) => activeSceneId !== sceneId) });
        });
    }, []);
    const onSceneUpdated = useCallback((scene) => {
        setState((state) => {
            const sceneIdx = state.scenes.findIndex((stateScene) => stateScene.id === scene.id);
            const updatedScenes = [...state.scenes];
            if (sceneIdx === -1) {
                updatedScenes.push(scene);
            }
            else {
                updatedScenes[sceneIdx] = scene;
            }
            return Object.assign(Object.assign({}, state), { scenes: updatedScenes });
        });
    }, []);
    const onSceneActivated = useCallback((sceneId) => {
        setState((state) => {
            const prevScene = state.scenes.find((scene) => scene.id === state.activeScenesIds[state.activeScenesIds.length - 1]);
            const nextScene = state.scenes.find((scene) => scene.id === sceneId);
            const transitions = prevScene && nextScene && runTransitions(prevScene, nextScene);
            return Object.assign(Object.assign(Object.assign({}, state), (transitions && { transitions })), { activeScenesIds: [...state.activeScenesIds, sceneId] });
        });
    }, []);
    const onSceneDeactivated = useCallback((sceneId) => {
        setState((state) => {
            const prevScene = state.scenes.find((scene) => scene.id === state.activeScenesIds[state.activeScenesIds.length - 1]);
            const nextScene = state.scenes.find((scene) => scene.id === state.activeScenesIds[state.activeScenesIds.length - 2]);
            const transitions = prevScene && nextScene && runTransitions(prevScene, nextScene);
            return Object.assign(Object.assign(Object.assign({}, state), (transitions && { transitions })), { activeScenesIds: state.activeScenesIds.filter((activeSceneId) => activeSceneId !== sceneId) });
        });
    }, []);
    const runTransitions = useCallback((prevScene, nextScene) => {
        const transitions = [];
        const progress = new Animated.Value(0);
        prevScene.elements.forEach((prevSceneElement) => {
            const nextSceneMatchingElement = nextScene.elements.find((nextSceneElement) => prevSceneElement.id === nextSceneElement.id);
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
        Animated.timing(progress, {
            toValue: 1,
            useNativeDriver: true,
            duration: 500,
            easing: Easing.out(Easing.exp),
        }).start(() => {
            setState((state) => (Object.assign(Object.assign({}, state), { transitions: [] })));
        });
        return transitions;
    }, []);
    return (<SharedTransitionContext.Provider value={Object.assign(Object.assign({}, state), { onSceneUpdated,
            onSceneDestroyed,
            onSceneActivated,
            onSceneDeactivated })}>
			{children}
			{!!state.transitions.length && (<View style={[StyleSheet.absoluteFillObject, { zIndex: 9999999999 }]} pointerEvents='box-only'>
					{state.transitions.map((transition) => (<SharedElementTransition start={{
                    node: transition.start.node,
                    ancestor: transition.start.ancestor,
                }} end={{
                    node: transition.end.node,
                    ancestor: transition.end.ancestor,
                }} position={transition.end.progress} animation='move' resize='auto' align='auto'/>))}
				</View>)}
		</SharedTransitionContext.Provider>);
};
export default SharedTransitionOrchestrator;
