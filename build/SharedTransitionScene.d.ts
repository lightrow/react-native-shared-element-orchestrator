import { FC, ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
interface ISharedElementSceneProps {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    containerStyle?: StyleProp<ViewStyle>;
    isActive?: boolean;
    id?: string;
    animateScene?: boolean;
}
declare const SharedTransitionScene: FC<ISharedElementSceneProps>;
export default SharedTransitionScene;
