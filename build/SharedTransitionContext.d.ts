/// <reference types="react" />
import { ISharedTransitionContext } from './model';
declare const SharedTransitionContext: import("react").Context<ISharedTransitionContext | null>;
export default SharedTransitionContext;
export declare const useSharedTransition: () => ISharedTransitionContext;
