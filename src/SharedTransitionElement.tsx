import { FC, ReactNode, memo, useEffect, useId, useRef } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { SharedElement, SharedElementNode } from 'react-native-shared-element';
import { useSharedTransitionScene } from './SharedTransitionSceneContext';

interface ISharedTransitionElementProps {
	children: ReactNode;
	id: string;
	style?: StyleProp<ViewStyle>;
	zIndex?: number;
}

const SharedTransitionElement: FC<ISharedTransitionElementProps> = memo(
	({ children, id, style, zIndex = 0 }) => {
		const { onElementDestroyed, onElementUpdated } = useSharedTransitionScene();
		const nodeRef = useRef<SharedElementNode | null>(null);

		useEffect(() => {
			if (!nodeRef.current) {
				return;
			}
			onElementUpdated({
				id,
				node: nodeRef.current,
				zIndex,
			});
			return () => {
				onElementDestroyed(id);
			};
		}, [id, zIndex]);

		const onNodeChanged = (node: SharedElementNode | null) => {
			if (!node) {
				onElementDestroyed(id);
			} else {
				nodeRef.current = node;
				onElementUpdated({
					id,
					node,
					zIndex,
				});
			}
		};

		return (
			<SharedElement style={style} onNode={onNodeChanged} id={id}>
				{children}
			</SharedElement>
		);
	}
);

export default SharedTransitionElement;
