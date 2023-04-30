import { useEffect, useRef } from 'react';

export const useUpdatedRef = <T>(value: T, deps?: unknown[]) => {
	const ref = useRef(value);

	useEffect(() => {
		ref.current = value;
	}, [deps || value]);

	return ref;
};

export const useUpdateEffect: typeof useEffect = (effect, deps) => {
	const isFirstMount = useFirstMountState();

	useEffect(() => {
		if (!isFirstMount) {
			return effect();
		}
	}, deps);
};

export const useFirstMountState = (): boolean => {
	const isFirst = useRef(true);

	if (isFirst.current) {
		isFirst.current = false;

		return true;
	}

	return isFirst.current;
};
