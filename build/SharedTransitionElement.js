import { useEffect, useId, useRef } from 'react';
import { SharedElement } from 'react-native-shared-element';
import { useSharedTransitionScene } from './SharedTransitionSceneContext';
const SharedTransitionElement = ({ children, style, id: propId, }) => {
    const id = propId || useId();
    const { onElementDestroyed, onElementUpdated } = useSharedTransitionScene();
    const nodeRef = useRef(null);
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
    const onNodeChanged = (node) => {
        if (!node) {
            onElementDestroyed(id);
        }
        else {
            nodeRef.current = node;
            onElementUpdated({
                id,
                node,
            });
        }
    };
    return (<SharedElement onNode={onNodeChanged} style={style}>
			{children}
		</SharedElement>);
};
export default SharedTransitionElement;
