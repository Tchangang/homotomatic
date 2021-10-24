import RulesManager from "../Domain/RuleManager";
import CommandDeviceInMemoryImpl from "./CommandDeviceInMemoryImpl";
import { CommandDevice } from "../Domain/CommandDevice";
import { Sensor } from "../Domain/Sensor";
import { Rule } from "../Domain/RuleManager/Rule";

describe('', () => {
    const rule: Rule = {
        id: "recCSnRzvSA35db3w",
        active: true,
        "rule-id": "chauffe-eau-avant-4h",
        description: "Eteindre le chauffe eau avant 4h",
        conditions: [
            [
                "timenow",
                "<",
                "4:30"
            ],
            [
                "Device.Chauffe-eau.power",
                "=",
                "true"
            ]
        ],
        actions: [
            [
                "Device.Chauffe-eau.power",
                false
            ]
        ]
    };
    const ruleManager = new RulesManager();
    test('Should turn off Chauffe-eau.power when rules arrives', () => {
        const devices: Array<CommandDevice> = [];
        const sensors: Array<Sensor> = [];
        devices.push(new CommandDeviceInMemoryImpl({
            name: 'Chauffe-eau',
            isOn: true,
        }));
        expect(devices.find(device => device.name === 'Chauffe-eau')?.isOn).toBe(true);
        ruleManager.eval([rule], { devices, sensors }, new Date().setHours(2,30));
        expect(devices.find(device => device.name === 'Chauffe-eau')?.isOn).toBe(false);
    });
    test('Should not turn off Chauffe-eau.power when rules arrives', () => {
        const devices: Array<CommandDevice> = [];
        const sensors: Array<Sensor> = [];
        devices.push(new CommandDeviceInMemoryImpl({
            name: 'Chauffe-eau',
            isOn: true,
        }));
        expect(devices.find(device => device.name === 'Chauffe-eau')?.isOn).toBe(true);
        ruleManager.eval([rule], { devices, sensors }, new Date().setHours(10,30));
        expect(devices.find(device => device.name === 'Chauffe-eau')?.isOn).toBe(true);
    });
});