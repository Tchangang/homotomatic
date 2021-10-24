import { CommandDevice } from "../CommandDevice";
import { Sensor } from "../Sensor";
import { Rule } from "./Rule";

type DevicesWithSensors = {
    devices: Array<CommandDevice>,
    sensors: Array<Sensor>,
};

class RulesManager {
    parseRule(left: string, right: string, devicesWithSensors: DevicesWithSensors, now: number = new Date().getTime()): {
        left: number | boolean,
        right: number | boolean,
    } {
        if (left === 'timenow') {
            const parsedTime = right.split(':');
            return { left: now, right: new Date().setHours(parseInt(parsedTime[0], 10), parseInt(parsedTime[1], 10), 0) };
        }
        if (left.startsWith('Device.')) {
            const device = {
                name: '',
                nameWithAttribute: left.replace(new RegExp('Device.', 'gmi'), ''),
                attribute: left.split('.').pop(),
            }
            switch (device.attribute) {
                case 'power':
                    device.name = device.nameWithAttribute.replace(new RegExp('.power', 'gmi'), '');
                    break;
                default:
                    throw new Error(`Unknwon device.attribute ${device.attribute} computed from ${left}.`);
            }
            const deviceFound = devicesWithSensors.devices.find(deviceIn => deviceIn.name === device.name);
            if (!deviceFound) {
                throw new Error(`Can not parse rule. Device ${device.name} not found`);
            }
            return { left: deviceFound.isOn, right: right === 'true' };
        }
        if (left.startsWith('Sensor.')) {
            const sensor = {
                name: '',
                nameWithAttribute: left.replace(new RegExp('Sensor.', 'gmi'), ''),
                attribute: left.split('.').pop(),
                value: 0,
            }
            switch (sensor.attribute) {
                case 'temperature':
                    sensor.name = sensor.nameWithAttribute.replace(new RegExp('.temperature', 'gmi'), '');
                    break;
                case 'humidity':
                    sensor.name = sensor.nameWithAttribute.replace(new RegExp('.humidity', 'gmi'), '');
                    break;
                default:
                    throw new Error(`Unknwon sensor.attribute ${sensor.attribute} computed from ${left}.`);
            }
            const sensorFound = devicesWithSensors.sensors.find(sensorIn => sensorIn.name === sensor.name);
            if (!sensorFound) {
                throw new Error(`Can not parse rule. Sensor ${sensor.name} not found`);
            }
            return { left: sensorFound[sensor.attribute], right: parseFloat(right) };
        }
        throw new Error('Unkwown config');
    }
    evalRule(rule: Array<string>, devicesWithSensors: DevicesWithSensors, now: number = new Date().getTime()) {
        const { left, right } = this.parseRule(rule[0], rule[2], devicesWithSensors, now);
        switch (rule[1]) {
            case '<':
                return left < right;
            case '>':
                return left > right;
            case '<=':
                return left <= right;
            case '>=':
                return left >= right;
            case '=':
                return left === right;
            default:
                return false;
        }
    }
    executeAction(action: Array<string | boolean>, devices: Array<CommandDevice>) {
        const left = action[0];
        if (typeof left === 'string' && left.startsWith('Device.')) {
            const device = {
                name: '',
                nameWithAttribute: left.replace(new RegExp('Device.', 'gmi'), ''),
                attribute: left.split('.').pop(),
            }
            switch (device.attribute) {
                case 'power':
                    device.name = device.nameWithAttribute.replace(new RegExp('.power', 'gmi'), '');
                    break;
                default:
                    throw new Error(`(Execute action) | Unknwon device.attribute ${device.attribute} computed from ${left}.`);
            }
            const deviceFound = devices.find(deviceIn => deviceIn.name === device.name);
            if (!deviceFound) {
                throw new Error(`Can not execute action. Device ${device.name} not found`);
            }
            if (action[1]) {
                deviceFound.on();
                return;
            }
            deviceFound.off();
        }
    }
    eval(rules: Array<Rule>, devicesWithSensors: DevicesWithSensors, now: number = new Date().getTime()) {
        return rules.filter(rule => rule.active).map((rule) => {
            try { 
                const evalResult = rule.conditions.map((condition) => this.evalRule(condition, devicesWithSensors, now));
                if (evalResult.filter(result => !!result).length === rule.conditions.length) {
                    console.log(JSON.stringify(rule.conditions, null, 4));
                    rule.actions.map((action) => {
                        this.executeAction(action, devicesWithSensors.devices);
                    });
                    return { 'rule-id': rule['rule-id'], executedAt: new Date().toString(), description: rule.description, status: 'success' };
                }
            } catch (e) {
                return { 'rule-id': rule['rule-id'], executedAt: new Date().toString(), description: rule.description, status: 'failed', error: (e as any).message };
            }
            return null;
        }).filter(log => !!log);
    }
}

export default RulesManager;