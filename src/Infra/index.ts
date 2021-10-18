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
        for (let i = 0; i < sensors.length; i += 1) {
            const sensor = sensors[i];
            await sensor.refresh();
            console.log(`${sensor.name}:\nHumidité: ${sensor.humidity}\nTempérature: ${sensor.temperature}\n\n`);
        }
    }
    const refreshDevices = async () => {
        for (let i = 0; i < devices.length; i += 1) {
            const device = devices[i];
            await device.refresh();
            console.log(`${device.name} (${device.manufacturer}):\nisOn: ${device.isOn}\n\n`);
        }
    }
    await refresh();
    await new Promise(resolve => setTimeout(resolve, 3000));
    setInterval(() => {
        refresh();
    }, 5000);
    await refreshDevices();
    await new Promise(resolve => setTimeout(resolve, 3000));
    setInterval(() => {
        refreshDevices();
    }, 60000*3);
    const checkRules = async () => {
        /****************************/
        // cuisine
        // de 4h à 7h -> allumer so temperature < 19.5
        // entre 22h et 00h00 si moins de 18 -> allumer radiateur
        /****************************/
        const cuisineDevice = devices.find(device => device.name === 'Radiateur cuisine');
        const cuisineSensor = sensors.find(sensor => sensor.name === 'Cuisine');
        console.log('cuisineDevice', cuisineDevice, cuisineSensor);
        if (cuisineDevice && cuisineSensor) {
            console.log('cuisine and sensor found');
            const date = {
                now: new Date().getTime(),
            }
            const limit = {
                '4h30': new Date().setHours(4, 30, 0),
                '7h00': new Date().setHours(7,0),
                '22h00': new Date().setHours(22, 0),
                '00h00': new Date().setHours(23,59),
            }
            if (date.now >= limit['4h30'] && date.now <= limit['7h00']) {
                if (cuisineSensor.temperature < 19.5 && !cuisineDevice.isOn) {
                    cuisineDevice.on();
                } else if (cuisineDevice.isOn && cuisineSensor.temperature >= 19.5) {
                    cuisineDevice.off();
                }
            }
            if (date.now >= limit['22h00'] && date.now <= limit['00h00']) {
                if (cuisineSensor.temperature < 18 && !cuisineDevice.isOn) {
                    cuisineDevice.on();
                } else if (cuisineDevice.isOn && cuisineSensor.temperature >= 18) {
                    cuisineDevice.off();
                }
            }
            if ((date.now > limit['00h00'] || date.now < limit['4h30']) && cuisineDevice.isOn) {
                cuisineDevice.off();
            }
        }

        /****************************/
        // Chambre
        // si température < 19.5° -> allumer radiateur
        // entre 19h et 00h -> allumer radiateur si temperateur < 20
        /****************************/
        const chambreDevice = devices.find(device => device.name === 'Radiateur chambre bebe');
        const chambreSensor = sensors.find(sensor => sensor.name === 'Chambre bebe');
        if (chambreDevice && chambreSensor) {
            console.log('chambre and sensor found');
            const date = {
                now: new Date().getTime(),
            }
            const limit = {
                '4h30': new Date().setHours(4, 30, 0),
                '7h00': new Date().setHours(7,0),
                '19h00': new Date().setHours(19, 0),
                '00h00': new Date().setHours(23,59),
            }
            if (date.now >= limit['4h30'] && date.now <= limit['7h00']) {
                if (chambreSensor.temperature < 19.5 && !chambreDevice.isOn) {
                    chambreDevice.on();
                } else if (chambreDevice.isOn && chambreSensor.temperature >= 19.5) {
                    chambreDevice.off();
                }
            }
            if (date.now >= limit['19h00'] && date.now <= limit['00h00']) {
                if (chambreSensor.temperature < 20 && !chambreDevice.isOn) {
                    chambreDevice.on();
                } else if (chambreDevice.isOn && chambreSensor.temperature >= 20) {
                    chambreDevice.off();
                }
            }
            if ((date.now > limit['00h00'] || date.now < limit['4h30']) && chambreSensor.temperature < 19 && !chambreDevice.isOn) {
                chambreDevice.on();
            }
            if ((date.now > limit['00h00'] || date.now < limit['4h30']) && chambreSensor.temperature) {
                chambreDevice.off();
            }
        }


        /****************************/
        // Salon
        // allumer de 4h30 à 6h00 si temperature < 20
        // entre 7h et 23h si températeur inférieur à 20 -> allumer radiateur
        // entre 23h et 4h30 si température inférieure à 18 -> allumer radiateur
        /****************************/
        const salonDevice = devices.find(device => device.name === 'Radiateur salon');
        const salonSensor = sensors.find(sensor => sensor.name === 'Salon');
        if (salonDevice && salonSensor) {
            console.log('salong and sensor found', salonDevice);
            const date = {
                now: new Date().getTime(),
            }
            const limit = {
                '4h30': new Date().setHours(4, 30, 0),
                '6h30': new Date().setHours(6,30, 0),
                '7h00': new Date().setHours(7,0),
                '19h00': new Date().setHours(19, 0),
                '23h00': new Date().setHours(23,0),
            }
            if (date.now >= limit['4h30'] && date.now <= limit['7h00']) {
                if (salonSensor.temperature < 21 && !salonDevice.isOn) {
                    salonDevice.on();
                } else if (salonDevice.isOn && salonSensor.temperature >= 21) {
                    salonDevice.off();
                }
            }
            if (date.now >= limit['7h00'] && date.now <= limit['19h00']) {
                if (salonSensor.temperature < 20 && !salonDevice.isOn) {
                    salonDevice.on();
                } else if (salonDevice.isOn && salonSensor.temperature >= 20) {
                    salonDevice.off();
                }
            }
            if (date.now >= limit['19h00'] && date.now <= limit['23h00']) {
                if (salonSensor.temperature < 20 && !salonDevice.isOn) {
                    salonDevice.on();
                } else if (salonDevice.isOn && salonSensor.temperature >= 20) {
                    salonDevice.off();
                }
            }
            if ((date.now >= limit['23h00'] || date.now < limit['4h30']) && salonDevice.isOn) {
                salonDevice.off();
            }
        }
    }
    await checkRules();
    setInterval(async () => {
        await checkRules();
    }, 60000);
    // routine
    // chauffe eau
    // allumer chaque jour de 4h30 à 7h
    // allumer chaque jour de 13h à 14h


    


    // salle de bain
    // allumer de 4h à 7h si temperature < 20
})();