import { useEffect, useRef } from 'react';

export const useUpdatedRef = <T>(value: T, deps?: unknown[]) => {
	const ref = useRef(value);

	useEffect(() => {
		ref.current = value;
	}, [deps || value]);

	return ref;
};
