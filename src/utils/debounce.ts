/* eslint-disable @typescript-eslint/no-explicit-any */
const debounce = <F extends (...params: T) => Promise<void> | void, T extends any[]>(
    fn: F,
    delay: number,
    leading?: boolean,
): F & { cancel: () => void } => {
    let timeoutID: NodeJS.Timeout | null = null;

    const debouncedFunction = function (this: unknown, ...args: T) {
        return new Promise(async resolve => {
            if (timeoutID) {
                clearTimeout(timeoutID);
            }
            if (leading && !timeoutID) {
                await fn.apply(this, args);
                resolve();
                timeoutID = setTimeout(() => {
                    timeoutID = null;
                }, delay);
            } else {
                timeoutID = setTimeout(async () => {
                    await fn.apply(this, args);
                    resolve();
                    timeoutID = null;
                }, delay);
            }
        });
    } as F & { cancel: () => void };

    debouncedFunction.cancel = () => {
        if (timeoutID) {
            clearTimeout(timeoutID);
            timeoutID = null;
        }
    };

    return debouncedFunction;
};

export default debounce;
