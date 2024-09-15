import { useEffect, useState, useRef, useCallback } from "react";

interface SerializationStrategy<T> {
    serialize: (value: T) => string;
    deserialize: (value: string) => T;
}

const defaultStrategy: SerializationStrategy<any> = {
    serialize: JSON.stringify,
    deserialize: JSON.parse,
};

function usePersistentState<T>(
    key: string,
    initialValue: T,
    strategy: SerializationStrategy<T> = defaultStrategy
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        const storedValue = localStorage.getItem(`state:${key}`);
        if (storedValue) {
            try {
                return strategy.deserialize(storedValue);
            } catch (error) {
                console.error(`Error deserializing stored value for key "${key}":`, error);
                return initialValue;
            }
        }
        return initialValue;
    });

    const latestState = useRef(state);

    useEffect(() => {
        latestState.current = state;
    }, [state]);

    useEffect(() => {
        const saveState = () => {
            try {
                localStorage.setItem(`state:${key}`, strategy.serialize(latestState.current));
            } catch (error) {
                console.error(`Error serializing value for key "${key}":`, error);
            }
        };

        window.addEventListener('beforeunload', saveState);

        return () => {
            saveState();
            window.removeEventListener('beforeunload', saveState);
        };
    }, [key, strategy]);

    const setStateAndPersist = useCallback((newState: React.SetStateAction<T>) => {
        setState((prevState) => {
            const nextState = typeof newState === 'function'
                ? (newState as (prevState: T) => T)(prevState)
                : newState;
            
            try {
                localStorage.setItem(`state:${key}`, strategy.serialize(nextState));
            } catch (error) {
                console.error(`Error serializing value for key "${key}":`, error);
            }
            
            return nextState;
        });
    }, [key, strategy]);

    return [state, setStateAndPersist];
}

export type { SerializationStrategy };
export default usePersistentState;