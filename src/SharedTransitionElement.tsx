import { FC, ReactNode, memo, useEffect, useId, useRef } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { SharedElement, SharedElementNode } from 'react-native-shared-element';
import { useSharedTransitionScene } from './SharedTransitionSceneContext';

interface ISharedTransitionElementProps {
	children: ReactNode;
	id: string;
	style?: StyleProp<ViewStyle>;
}

const SharedTransitionElement: FC<ISharedTransitionElementProps> = memo(
	({ children, id, style }) => {
		const { onElementDestroyed, onElementUpdated } = useSharedTransitionScene();
		const nodeRef = useRef<SharedElementNode | null>(null);

		useEffect(() => {
			if (!nodeRef.current) {
				return;
			}
			onElementUpdated({
				id,
				node: nodeRef.current,
			});
			return () => {
				onElementDestroyed(id);
			};
		}, [id]);

		const onNodeChanged = (node: SharedElementNode | null) => {
			if (!node) {
				onElementDestroyed(id);
			} else {
				nodeRef.current = node;
				onElementUpdated({
					id,
					node,
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
