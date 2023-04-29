import { Animated } from 'react-native';
import { SharedElementNode } from 'react-native-shared-element';

export interface ISharedTransition {
	start: {
		node: SharedElementNode;
		ancestor: SharedElementNode;
		progress: Animated.AnimatedInterpolation<number>;
		sceneId: ISharedTransitionScene['id'];
	};
	end: {
		node: SharedElementNode;
		ancestor: SharedElementNode;
		progress: Animated.Value;
		sceneId: ISharedTransitionScene['id'];
	};
}

export interface ISharedTransitionScene {
	id: string;
	elements: ISharedTransitionElement[];
	ancestor: SharedElementNode;
}

export interface ISharedTransitionElement {
	id: string;
	node: SharedElementNode;
}

export interface ISharedTransitionContext {
	onSceneUpdated: (scene: ISharedTransitionScene) => void;
	onSceneDestroyed: (sceneId: ISharedTransitionScene['id']) => void;
	onSceneActivated: (sceneId: ISharedTransitionScene['id']) => void;
	onSceneDeactivated: (sceneId: ISharedTransitionScene['id']) => void;

	scenes: ISharedTransitionScene[];
	transitions: ISharedTransition[];
	activeScenesIds: ISharedTransitionScene['id'][];
}

export interface ISharedTransitionSceneContext {
	onElementUpdated: (element: ISharedTransitionElement) => void;
	onElementDestroyed: (elementId: ISharedTransitionElement['id']) => void;
}
