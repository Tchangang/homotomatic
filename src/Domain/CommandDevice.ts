enum Manufacturer {
    tuya = 'TUYA',
    sonoff = 'SONOFF',
};
export {
    Manufacturer,
}
interface CommandDevice {
    id: string;
    name: string;
    manufacturer: Manufacturer;
    isOn: boolean;
    refresh: () => Promise<void>;
    on: () => Promise<void>;
    off: () => Promise<void>;
    toggle: () => Promise<void>;
}

export {
    CommandDevice,
};