import fetch from 'node-fetch';
import { Sensor } from '../Domain/Sensor';

class SensorSwitchBotAdapter {
    id: string;
    private token: string;
    name: string;
    private hubId: string;
    humidity: number = 0;
    temperature: number = 0;
    constructor(params: {
        id: string;
        token: string;
        name: string;
        hubId: string;
    }) {
        this.id = params.id;
        this.token = params.token;
        this.name = params.name;
        this.hubId = params.hubId;
    }
    async refresh() {
        const rep = await fetch(`https://api.switch-bot.com/v1.0/devices/${this.id}/status`, {
            headers: {
                'Authorization': this.token,
                'Content-Type': 'application/json'
            }
        });
        const resp = await rep.json();
        if (resp?.body?.humidity) {
            this.humidity = resp?.body?.humidity;
        }
        if (resp?.body?.temperature) {
            this.temperature = resp?.body?.temperature;
        }
    }
}

export {
    SensorSwitchBotAdapter,
}

class SwitchBotSensorManager {
    token;
    constructor(token: string) {
        this.token = token;
    }
    async listDevices(): Promise<Array<Sensor>> {
        const rep = await fetch(`https://api.switch-bot.com/v1.0/devices`, {
            headers: {
                'Authorization': this.token,
                'Content-Type': 'application/json'
            }
        });
        const resp = await rep.json();
        if (Array.isArray(resp?.body?.deviceList) && resp?.body?.deviceList?.length > 0) {
            return resp?.body?.deviceList.map((item: any) => new SensorSwitchBotAdapter({
                id: item.deviceId,
                token: this.token,
                hubId: item.hubDeviceId,
                name: item.deviceName,
            }));
        }
        return [];
    }
}

export {
    SwitchBotSensorManager,
}

// (async () => {
//     const bot = new SwitchBot(config.token);
//     await bot.listDevices();
// })();