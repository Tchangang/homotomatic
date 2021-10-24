import { CommandDevice, Manufacturer } from "../Domain/CommandDevice";
import { v4 } from 'uuid';

class CommandDeviceInMemoryImpl implements CommandDevice {
    id = v4();
    name: string;
    manufacturer: Manufacturer;
    isOn: boolean;
    constructor(params: {
        id?: string;
        manufacturer?: Manufacturer;
        isOn?: boolean;
        name: string;
    }) {
        this.name = params.name;
        if (params.id) {
            this.id = params.id;
        }
        this.manufacturer = params.manufacturer || Manufacturer.tuya;
        this.isOn = typeof params.isOn === 'boolean' ? params.isOn : false;
    }
    async refresh() {

    }
    async on() {
        this.isOn = true;
    }
    async off() {
        this.isOn = false;
    }
    async toggle() {
        this.isOn = !this.isOn;
    }
    json() {
        return {
            id: this.id,
            name: this.name,
            manufacturer: this.manufacturer,
            status: this.isOn,
        };
    }
}

export default CommandDeviceInMemoryImpl;