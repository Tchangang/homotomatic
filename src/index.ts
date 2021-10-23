import { SwitchBotSensorManager } from "./Service/SensorSwitchBotAdapter";

(async () => {
    const bot = new SwitchBotSensorManager(process.env.SWITCHBOT_BOUSCAT_TOKEN!);
    const devices = await bot.listDevices();
    console.log(devices);
    const device = devices.find(device => device.name === 'Chambre bebe');
    console.log(await device?.refresh());
    console.log(device);
})();