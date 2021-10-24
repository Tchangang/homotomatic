import express from 'express';
import AuthUser from '../Controller/AuthUser';
import { CommandDevice } from "../Domain/CommandDevice";
import RulesManager from "../Domain/RuleManager";
import { Rule } from "../Domain/RuleManager/Rule";
import { Sensor } from "../Domain/Sensor";
import { User } from "../Domain/User";
import EnvReader from "../Readers/EnvReader";
import AirTableRulesAdapter from "../Service/AirTableRulesAdapter";
import { SonOffDeviceManager } from "../Service/CommandDeviceSonoffAdapter";
import { TuyaManager } from "../Service/CommandDeviceTuyaAdapter";
import { SwitchBotSensorManager } from "../Service/SensorSwitchBotAdapter";

const env = EnvReader.get();
const airtableService = new AirTableRulesAdapter({
    apikey: env.AIRTABLE_APIKEY,
    airtableId: env.AIRTABLE_TABLE_ID,
});
const rulesManager = new RulesManager();
const switchBotManager = new SwitchBotSensorManager(env.SWITCHBOT_TOKEN);
const sonOffManager = new SonOffDeviceManager({
    email: env.EWELINK_EMAIL,
    password: env.EWELINK_PASSWORD,
    region: env.EWELINK_REGION,
});
const tuyaManager = new TuyaManager({
    accessKey: env.TUYA_CLIENT_ID,
    secretKey: env.TUYA_CLIENT_SECRET,
});
let rules: Array<Rule> = [];
const devices: Array<CommandDevice> = [];
const sensors: Array<Sensor> = [];
let users: Array<User> = [];

const refreshSensors = async () => {
    console.log('\n\nSensors:\n');
    for (let i = 0; i < sensors.length; i += 1) {
        const sensor = sensors[i];
        await sensor.refresh();
        console.log(`${sensor.name}:\nHumidité: ${sensor.humidity}\nTempérature: ${sensor.temperature}\n`);
    }
}
const refreshDevices = async () => {
    console.log('\n\nDevices:\n')
    for (let i = 0; i < devices.length; i += 1) {
        const device = devices[i];
        await device.refresh();
        console.log(`${device.name} (${device.manufacturer}):\nisOn: ${device.isOn}\n`);
    }
}
const checkRules = async () => {
    const logs = rulesManager.eval(rules, {
        sensors, 
        devices,
    });
    console.log(JSON.stringify(logs, null, 4));
}

async function init() {
    rules = await airtableService.getRules();
    sensors.push(...await switchBotManager.listDevices());
    devices.push(...(await tuyaManager.listDevicesForUser(env.TUYA_USER_ID)));
    devices.push(...(await sonOffManager.listDevices()));
    await refreshSensors();
    await refreshDevices();
    await checkRules();
    users = await airtableService.getUsers();
    console.log('users', users);
    /* *********************************** */
    // Start refresh devices and sensors
    /* *********************************** */
    // await new Promise(resolve => setTimeout(resolve, 3000));
    setInterval(() => {
        refreshSensors();
    }, env.REFRESH_SENSOR);
    // await new Promise(resolve => setTimeout(resolve, 3000));
    setInterval(() => {
        refreshDevices();
    }, env.REFRESH_DEVICE);
    /* *********************************** */
    // Evaluate Rules
    /* *********************************** */
    setInterval(async () => {
        await checkRules();
    }, env.CHECK_RULES);
    /* *********************************** */
    // Refresh rules from airtable
    /* *********************************** */
    setInterval(async () => {
        rules = await airtableService.getRules();
    }, env.REFRESH_RULES);
    setInterval(async () => {
        users = await airtableService.getUsers();
    }, env.REFRESH_USERS);
}    
    
init();

const app = express();

app.get('/devices', async (req, res) => {
    const user = await AuthUser(req.query, users);
    if (!user) {
        return res.status(403).json({ message: 'Invalid authentication' });
    }
    return res.status(200).json(devices.map(device => device.json()));
});

app.get('/sensors', async (req, res) => {
    const user = await AuthUser(req.query, users);
    if (!user) {
        return res.status(403).json({ message: 'Invalid authentication' });
    }
    return res.status(200).json(sensors.map(sensor => sensor.json()));
});

app.get('/rules', async (req, res) => {
    const user = await AuthUser(req.query, users);
    if (!user) {
        return res.status(403).json({ message: 'Invalid authentication' });
    }
    return res.status(200).json(rules);
});
app.get('/time', async (req, res) => {
    const user = await AuthUser(req.query, users);
    if (!user) {
        return res.status(403).json({ message: 'Invalid authentication' });
    }
    return res.status(200).json({ date: new Date().toString() });
});



app.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
});
  