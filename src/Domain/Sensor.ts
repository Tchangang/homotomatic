interface Sensor {
    id: string;
    name: string;
    temperature: number;
    humidity: number;
    refresh: () => Promise<void>;
    json: () => {
        id: string;
        name: string;
        temperature: number;
        humidity: number;
    }
}

export {
    Sensor,
}