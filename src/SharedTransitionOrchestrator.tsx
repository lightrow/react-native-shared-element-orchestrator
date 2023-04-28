import React, { FC, ReactNode, useCallback, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { SharedElementTransition } from 'react-native-shared-element';
import { ISharedTransition, ISharedTransitionScene } from './model';
import SharedTransitionContext from './SharedTransitionContext';

export interface ISharedTransitionOrchestratorProps {
  children: ReactNode;
}

const SharedTransitionOrchestrator: FC<ISharedTransitionOrchestratorProps> = ({
  children,
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

      Animated.timing(progress, {
        toValue: 1,
        useNativeDriver: true,
        duration: 500,
        easing: Easing.out(Easing.exp),
      }).start(() => {
        setState((state) => ({ ...state, transitions: [] }));
      });

      return transitions;
    },
    []
  );

  return (
    <SharedTransitionContext.Provider
      value={{
        ...state,
        onSceneUpdated,
        onSceneDestroyed,
        onSceneActivated,
        onSceneDeactivated,
      }}
    >
      {children}
      {!!state.transitions.length && (
        <View
          style={[StyleSheet.absoluteFillObject, { zIndex: 9999999999 }]}
          pointerEvents='box-only'
        >
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

export default SharedTransitionOrchestrator;
