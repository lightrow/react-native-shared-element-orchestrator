import { FC, ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
interface ISharedTransitionElementProps {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    id?: string;
}
declare const SharedTransitionElement: FC<ISharedTransitionElementProps>;
export default SharedTransitionElement;
