import { createContext, useContext } from 'react';
import { ISharedTransitionContext } from './model';

const SharedTransitionContext = createContext<ISharedTransitionContext | null>(null);

export default SharedTransitionContext;

export const useSharedTransition = () => {
    const context = useContext(SharedTransitionContext);
    if (!context) {
        throw 'Missing SharedTransitionContext.Provider';
    }
    return context;
};
