import { createContext, useContext } from 'react';
import { ISharedTransitionSceneContext } from './model';

const SharedTransitionSceneContext =
	createContext<ISharedTransitionSceneContext | null>(null);

export default SharedTransitionSceneContext;

export const useSharedTransitionScene = () => {
	const context = useContext(SharedTransitionSceneContext);
	if (!context) {
		throw 'Missing SharedTransitionSceneContext.Provider';
	}
	return context;
};
