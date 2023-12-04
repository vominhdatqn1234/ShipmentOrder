import { isFunction } from "lodash";
import { SetStateAction, useEffect, useRef, useState } from "react";

export function useAsyncState<T>(
    initialValue: T
): [
    T,
    (newValue: SetStateAction<T>, callback?: (newState: T) => void) => void
] {
    const [state, setState] = useState(initialValue);
    const _callback = useRef<(newState: T) => void>();

    const _setState = (
        newValue: SetStateAction<T>,
        callback?: (newState: T) => void
    ) => {
        if (callback) {
            _callback.current = callback;
        }
        setState(newValue);
    };

    useEffect(() => {
        if (isFunction(_callback.current)) {
            _callback.current(state);
            _callback.current = undefined;
        }
    }, [state]);
    return [state, _setState];
}