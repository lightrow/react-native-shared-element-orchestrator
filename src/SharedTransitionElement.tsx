import { FC, ReactNode, useEffect, useId, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SharedElement, SharedElementNode } from 'react-native-shared-element';
import { useSharedTransitionScene } from './SharedTransitionSceneContext';

interface ISharedTransitionElementProps {
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
	id?: string;
}

const SharedTransitionElement: FC<ISharedTransitionElementProps> = ({
	children,
	style,
	id: propId,
}) => {
	const id = propId || useId();
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
		<SharedElement onNode={onNodeChanged} style={style}>
			{children}
		</SharedElement>
	);
};

export default SharedTransitionElement;
