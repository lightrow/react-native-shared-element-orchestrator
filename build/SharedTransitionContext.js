import { createContext, useContext } from 'react';
const SharedTransitionContext = createContext(null);
export default SharedTransitionContext;
export const useSharedTransition = () => {
    const context = useContext(SharedTransitionContext);
    if (!context) {
        throw 'Missing SharedTransitionContext.Provider';
    }
    return context;
};
