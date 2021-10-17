import { CommandDevice } from "../Domain/CommandDevice";
import EnvReader from "../Readers/EnvReader";
import { SonOffDeviceManager } from "../Service/CommandDeviceSonoffAdapter";
import { TuyaManager } from "../Service/CommandDeviceTuyaAdapter";
import { SwitchBotSensorManager } from "../Service/SensorSwitchBotAdapter";

(async () => {
    const env = EnvReader.get();
    const switchBotManager = new SwitchBotSensorManager(env.SWITCHBOT_TOKEN);
    const sensors = await switchBotManager.listDevices();
    const tuyaManager = new TuyaManager({
        accessKey: env.TUYA_CLIENT_ID,
        secretKey: env.TUYA_CLIENT_SECRET,
    });
    const sonOffManager = new SonOffDeviceManager({
        email: env.EWELINK_EMAIL,
        password: env.EWELINK_PASSWORD,
        region: env.EWELINK_REGION,
    });
    const devices: Array<CommandDevice> = [];
    devices.push(...(await tuyaManager.listDevicesForUser(env.TUYA_USER_ID)));
    devices.push(...(await sonOffManager.listDevices()));
    console.log(devices);
    
    const refresh = async () => {
        console.log('\n\n');
        sensors.forEach((sensor) => {
            sensor.refresh()
            .then(() => {
                console.log(`${sensor.name}:\nHumidité: ${sensor.humidity}\nTempérature: ${sensor.temperature}\n\n`);
            });
        })
    }
    refresh();
    setInterval(() => {
        refresh();
    }, 5000);

})();