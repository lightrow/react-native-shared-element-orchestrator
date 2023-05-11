import { Animated } from 'react-native';
import { SharedElementNode } from 'react-native-shared-element';

export interface ISharedTransition {
	start: {
		node: SharedElementNode;
		ancestor: SharedElementNode;
		sceneId: ISharedTransitionScene['id'];
	};
	end: {
		node: SharedElementNode;
		ancestor: SharedElementNode;
		sceneId: ISharedTransitionScene['id'];
	};
	progress: Animated.AnimatedInterpolation<number>;
	zIndex: number;
}

export interface ISharedTransitionScene {
	id: string;
	elements: ISharedTransitionElement[];
	ancestor: SharedElementNode;
	progress: Animated.Value;
	onTransitionEnd?: () => void;
}

export interface ISharedTransitionElement {
	id: string;
	node: SharedElementNode;
	zIndex: number;
}

export interface ISharedTransitionContext {
	onSceneUpdated: (scene: ISharedTransitionScene) => void;
	onSceneDestroyed: (sceneId: ISharedTransitionScene['id']) => void;
	onSceneActivated: (sceneId: ISharedTransitionScene['id']) => void;
	onSceneDeactivated: (sceneId: ISharedTransitionScene['id']) => void;
}

export interface ISharedTransitionSceneContext {
	onElementUpdated: (element: ISharedTransitionElement) => void;
	onElementDestroyed: (elementId: ISharedTransitionElement['id']) => void;
	progress: Animated.Value;
}
