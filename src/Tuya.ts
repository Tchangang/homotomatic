import * as qs from 'qs';
import * as crypto from 'crypto';
import { AxiosInstance, default as axios } from 'axios';

type TuyaAuthToken = {
    access_token: string;
    expire_time: number;
    refresh_token: string;
    uid: string;
}
enum HttpMethod {
    get = 'GET',
    put = 'PUT',
    post = 'POST',
};
type TuyaQueryConstructor = {
    host?: string;
    accessKey: string;
    secretKey: string;
    token?: TuyaAuthToken;
};

class TuyaQuery {
    host: string = 'https://openapi.tuyaeu.com';
    accessKey: string;
    secretKey: string;
    httpClient: AxiosInstance;
    token: TuyaAuthToken | undefined;
    constructor(params: TuyaQueryConstructor) {
        this.accessKey = params.accessKey;
        this.secretKey = params.secretKey;
        if (params.host) {
            this.host = params.host;
        }
        this.httpClient = axios.create({
            baseURL: this.host,
            timeout: 5 * 1e3,
        });
        if (params.token) {
            this.token = params.token;
        }
    }
    private async checkToken() {
        if (!this.token) {
            await this.getToken();
            return;
        }
        if (this.token!.expire_time - new Date().getTime() < 0) {
            await this.refreshToken();
        }
    }
    private async refreshToken() {
        const method = 'GET';
        const timestamp = Date.now().toString();
        const signUrl = `/v1.0/token/${this.token!.refresh_token}`;
        const contentHash = crypto.createHash('sha256').update('').digest('hex');
        const stringToSign = [method, contentHash, '', signUrl].join('\n');
        const signStr = this.accessKey + timestamp + stringToSign;
        const headers = {
            t: timestamp,
            sign_method: 'HMAC-SHA256',
            client_id: this.accessKey,
            sign: await this.encryptStr(signStr, this.secretKey),
        };
        const { data: login } = await this.httpClient.get(`/v1.0/token/${this.token!.refresh_token}`, { headers });
        console.log('data', login);
        if (!login || !(<any>login).success) {
            throw Error(`Refresh Authorization Failed: ${(<any>login).msg}`);
        }
        this.token = (<any>login).result;
        console.log('token', this.token);
        this.token!.expire_time = new Date().getTime() + this.token!.expire_time - 60;
    }
    private async getToken() {
        const method = 'GET';
        const timestamp = Date.now().toString();
        const signUrl = '/v1.0/token?grant_type=1';
        const contentHash = crypto.createHash('sha256').update('').digest('hex');
        const stringToSign = [method, contentHash, '', signUrl].join('\n');
        const signStr = this.accessKey + timestamp + stringToSign;
        const headers = {
            t: timestamp,
            sign_method: 'HMAC-SHA256',
            client_id: this.accessKey,
            sign: await this.encryptStr(signStr, this.secretKey),
        };
        const { data: login } = await this.httpClient.get('/v1.0/token?grant_type=1', { headers });
        if (!login || !(<any>login).success) {
            throw Error(`Authorization Failed: ${(<any>login).msg}`);
        }
        this.token = (<any>login).result;
        console.log('token', this.token);
        this.token!.expire_time = new Date().getTime() + this.token!.expire_time - 60;
    }
    private async encryptStr(str: string, secret: string): Promise<string> {
        return crypto.createHmac('sha256', secret).update(str, 'utf8').digest('hex').toUpperCase();
    }
    /**
     * Request signature, which can be passed as headers
     * @param path
     * @param method
     * @param headers
     * @param query
     * @param body
     */
    private async getRequestSign(
        path: string,
        method: string,
        headers: { [k: string]: string } = {},
        query: { [k: string]: any } = {},
        body: { [k: string]: any } = {},
    ): Promise<{ t: string; path: string; client_id: string; sign: string; sign_method: string; access_token: string }> {
        await this.checkToken();
        const t = Date.now().toString();
        const [uri, pathQuery] = path.split('?');
        const queryMerged = Object.assign(query, qs.parse(pathQuery));
        const sortedQuery: { [k: string]: string } = {};
        Object.keys(queryMerged)
        .sort()
        .forEach((i) => (sortedQuery[i] = query[i]));
        console.log('sortedQuery', sortedQuery);
    
        const querystring = decodeURIComponent(qs.stringify(sortedQuery));
        console.log('querystring', querystring);
        const url = querystring ? `${uri}?${querystring}` : uri;
        console.log('url', url);
        const contentHash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
        const stringToSign = [method, contentHash, '', url].join('\n');
        const signStr = this.accessKey + this.token?.access_token + t + stringToSign;
        return {
            t,
            path: url,
            client_id: this.accessKey,
            sign: await this.encryptStr(signStr, this.secretKey),
            sign_method: 'HMAC-SHA256',
            access_token: this.token!.access_token,
        };
    }
    public async run(params: {
        query: Record<string, any>;
        method: HttpMethod;
        url: string;
        headers?: Record<string, string>,
        body?: any | undefined,
    }) {
        await this.checkToken();
        const reqHeaders: { [k: string]: string } = await this.getRequestSign(params.url, params.method, params.headers || {},
            { ...(params.query || {}) });
    //         method,
    // data: {},
    // params: {},
    // headers: reqHeaders,
    // url: reqHeaders.path,
    console.log(params.query);
        return this.httpClient.request({
            method: params.method,
            data: params.body || {},
            params: {},
            headers: reqHeaders,
            url: reqHeaders.path,
        });
    }
}

class Tuya extends TuyaQuery {
    constructor(params: TuyaQueryConstructor) {
        super(params);
    }
    async listDevicesForUser(userId: string) {
        const list = await this.run({
            query: {},
            method: HttpMethod.get,
            url: `/v1.0/users/${userId}/devices`,
        });
        return list.data;
    }
    async getDevice(deviceId: string) {
        const rep = await this.run({
            query: {},
            method: HttpMethod.get,
            url: `/v1.0/devices/bf78bc658e9da135abeyub`,
        });
        return rep.data;
    }
    async turnOnDevice(deviceId: string) {

    }
    async turnOffDevice(deviceId: string) {

    }
}


(async () => {
    const tuya = new Tuya({
        accessKey: process.env.TUYA_BOUSCAT_CLIENTID!,
        secretKey: process.env.TUYA_BOUSCAT_SECRET!,
        token: {
            access_token: '0a8360f81374bf967752d06a630e8942',
            expire_time: 1634370301599,
            refresh_token: '6bde53a0c083d39929f2b94e9e49f1f1',
            uid: 'bay1634358390012bC43'
        },
    });
    const devices = await tuya.listDevicesForUser(process.env.TUYA_USERID!);
    console.log(devices);

    
    // try {
    //     const list = await tuya.run({
    //         query: {
    //             size: 50,
    //         },
    //         method: HttpMethod.get,
    //         url: '/v2.0/devices'
    //     });
    //     console.log('list', list);
    // } catch (e) {
    //     console.log('error', e);
    // }
    // const list = await tuya.run({
    //     query: {},
    //     method: HttpMethod.get,
    //     url: `/v1.0/users/${process.env.TUYA_USERID!}/devices`,
    // });
    // console.log(list.data);
    // const rep = await tuya.run({
    //     query: {},
    //     method: HttpMethod.get,
    //     url: `/v1.0/devices/bf78bc658e9da135abeyub`,
    // });
    // console.log(rep.data);
})();
// User local maintenance highway token
// let token = '';

// const config = {
//   /* Service address */
//   host: 'https://openapi.tuyaeu.com',
//   /* Access Id */
//   accessKey: process.env.TUYA_BOUSCAT_CLIENTID!,
//   /* Access Secret */
//   secretKey: process.env.TUYA_BOUSCAT_SECRET!,
//   /* Interface example device_id */
//   deviceId: 'bf78bc658e9da135abeyub',
//   token: '4a457d937692a1ddf75f5bb4073c5e88'
// };


// async function main() {
//   await getToken();
//   const data = await getDeviceInfo(config.deviceId);
//   console.log('success: ', JSON.stringify(data));
// }

// /**
//  * fetch highway login token
//  */
// async function getToken() {
  
// }

// /**
//  * fetch highway business data
//  */
// async function getDeviceInfo(deviceId: string) {
//   const query = {};
//   const method = 'GET';
//   const url = `/v1.0/devices/${deviceId}`;
//   const reqHeaders: { [k: string]: string } = await getRequestSign(url, method, {}, query);

//   const { data } = await httpClient.request({
//     method,
//     data: {},
//     params: {},
//     headers: reqHeaders,
//     url: reqHeaders.path,
//   });
//   console.log(data);
//   if (!data || !(data as any).success) {
//     throw Error(`Request highway Failed: ${(data as any).msg}`);
//   }
// }





// main().catch(err => {
//   throw Error(`ERROE: ${err}`);
// });
