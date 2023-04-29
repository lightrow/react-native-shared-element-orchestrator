import { createContext, useContext } from 'react';
const SharedTransitionSceneContext = createContext(null);
export default SharedTransitionSceneContext;
export const useSharedTransitionScene = () => {
    const context = useContext(SharedTransitionSceneContext);
    if (!context) {
        throw 'Missing SharedTransitionSceneContext.Provider';
    }
    return context;
};
