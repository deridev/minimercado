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
    const [value, setValue] = useState<T>(() => {
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

    const timeoutRef = useRef<number | null>(null);

    const debouncedSave = useCallback((newValue: T) => {
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            try {
                localStorage.setItem(`state:${key}`, strategy.serialize(newValue));
            } catch (error) {
                console.error(`Error serializing value for key "${key}":`, error);
            }
            timeoutRef.current = null;
        }, 100) as unknown as number;
    }, [key, strategy]);

    useEffect(() => {
        debouncedSave(value);
        
        return () => {
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [value, debouncedSave]);

    return [value, setValue];
}

export type { SerializationStrategy };
export default usePersistentState;