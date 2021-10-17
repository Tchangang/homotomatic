import eWelink from 'ewelink-api';
import ewelink from 'ewelink-api';
import { CommandDevice, Manufacturer } from '../Domain/CommandDevice';


type SonOffLogin = {
  email: string;
  password: string;
  region: string;
}

class CommandDeviceSonOffAdater implements CommandDevice{
  id: string;
  name: string;
  connection: ewelink;
  manufacturer = Manufacturer.sonoff;
  isOn: boolean = false;
  constructor(params: {
    id: string;
    name: string;
    connection: eWelink;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.connection = params.connection;
  }
  async refresh() {
    const state = await this.connection.getDevicePowerState(this.id);
    console.log('state', state);
    this.isOn = state.state === 'on';
  }
  async on() {
    await this.connection.setDevicePowerState(this.id, 'on');
  }
  async off() {
    await this.connection.setDevicePowerState(this.id, 'on');
  }
  async toggle() {
    await this.connection.toggleDevice(this.id);
  }
}
export {
  CommandDeviceSonOffAdater,
}

class SonOffDeviceManager {
  login: SonOffLogin;
  connection: eWelink;
  constructor(params: SonOffLogin) {
    this.login = params;
    this.connection = new ewelink(<any>this.login);
  }
  async listDevices() {
    const devices = await this.connection.getDevices();
    return devices.map(device => new CommandDeviceSonOffAdater({
      id: device.deviceid,
      name: device.name,
      connection: this.connection,
    }))
  }
}
export {
  SonOffDeviceManager,
}
(async () => {

    // const connection = new ewelink(<any>{
    //   email: process.env.EWELINK_EMAIL!,
    //   password: process.env.EWELINK_PASSWORD!,
    //   region: process.env.EWELINK_REGION!,
    // });
    // /* get all devices */
    // const devices = await connection.getDevices();
    // console.log(devices);
  
    // /* get specific devide info */
    // const device = await connection.getDevice('1000f10a36');
    // console.log(device);
  
    // /* toggle device */
    // await connection.setDevicePowerState('1000f10a36', 'on');
    // setTimeout(async () => {
    //   await connection.setDevicePowerState('1000f10a36', 'off');
    // }, 3000);
    // await connection.toggleDevice('<your device id>');
  
  })();
