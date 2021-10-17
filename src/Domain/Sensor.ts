interface Sensor {
    id: string;
    name: string;
    temperature: number;
    humidity: number;
    refresh: () => Promise<void>;
}

export {
    Sensor,
}