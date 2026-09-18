type ControlValue = string | number | boolean | undefined;
type ControlListener<T extends ControlValue> = (value: T, oldValue: T) => void;

const valueMap = new Map<string, ControlValue>();
const listenerMap = new Map<string, ControlListener<any>[]>();

export function setControlValue<T extends ControlValue>(key: string, value: T) {
    const oldValue = valueMap.get(key);
    valueMap.set(key, value);
    listenerMap.get(key)?.forEach(callback => callback(value, oldValue));
}

export function getControlValue<T extends ControlValue>(key: string) {
    return valueMap.get(key) as T;
}

export function addControlListener<T extends ControlValue>(key: string, callback: ControlListener<T>) {
    const value = getControlValue<T>(key);
    if (value !== undefined) {
        callback(value, value);
    }
    
    const listeners = listenerMap.get(key);
    if (listeners === undefined) {
        listenerMap.set(key, [callback]);
        return;
    }

    if (!listeners.some(c => c === callback)) {
        listeners.push(callback);
    }
}

export function removeControlListener<T extends ControlValue>(key: string, callback: ControlListener<T>) {
    const listeners = listenerMap.get(key);
    if (!listeners) {
        return;
    }

    const index = listeners.findIndex(existingCallback => existingCallback === callback);
    if (index === -1) {
        return;
    }

    listeners.splice(index, 1);
}