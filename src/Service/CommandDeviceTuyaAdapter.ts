import * as qs from 'qs';
import * as crypto from 'crypto';
import { AxiosInstance, default as axios } from 'axios';
import { CommandDevice, Manufacturer } from '../Domain/CommandDevice';

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
    private host: string = 'https://openapi.tuyaeu.com';
    private accessKey: string;
    private secretKey: string;
    private httpClient: AxiosInstance;
    private token: TuyaAuthToken | undefined;
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
        this.token!.expire_time = new Date().getTime() + ((this.token!.expire_time - 60) * 1000);
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
        this.token!.expire_time = new Date().getTime() + ((this.token!.expire_time - 60) * 1000);
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
            { ...(params.query || {}) }, params.body);
    //         method,
    // data: {},
    // params: {},
    // headers: reqHeaders,
    // url: reqHeaders.path,
    console.log(params.query);
        return this.httpClient.request<any>({
            method: params.method,
            data: params.body || {},
            params: {},
            headers: reqHeaders,
            url: reqHeaders.path,
        });
    }
}
class CommandDeviceTuyaAdater implements CommandDevice{
    name: string;
    id: string;
    manufacturer = Manufacturer.tuya;
    isOn: boolean = false;
    private query;
    constructor(params: {
        id: string;
        name: string;
        query: TuyaQuery;
    }) {
        this.name = params.name;
        this.id = params.id;
        this.query = params.query;
    }
    async refresh() {
        await this.getStatus();
    }
    private async getStatus() {
        const rep = await this.query.run({
            query: {},
            method: HttpMethod.get,
            url: `/v1.0/devices/${this.id}`,
        });
        const state = rep.data.result?.status?.find((item: { code: string, value: any }) => item.code === 'switch_1')?.value;
        this.isOn = !!state;
        return state;
    }
    async on() {
        const result = await this.query.run({
            query: {},
            method: HttpMethod.post,
            body: { commands: [ { code: "switch_1", value: true } ] },
            url: `/v1.0/devices/${this.id}/commands`,
        });
        console.log(`${this.name} is on`);
    }
    async off() {
        const result = await this.query.run({
            query: {},
            method: HttpMethod.post,
            body: { commands: [ { code: "switch_1", value: false } ] },
            url: `/v1.0/devices/${this.id}/commands`,
        });
        console.log(`${this.name} is off`);
    }
    async toggle() {
        const state = await this.getStatus();
        if (!state) {
            await this.on();
            return;
        }
        await this.off();
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

class TuyaManager {
    query: TuyaQuery;
    constructor(params: TuyaQueryConstructor) {
        this.query = new TuyaQuery(params);
    }
    async listDevicesForUser(userId: string): Promise<Array<CommandDevice>> {
        const list = await this.query.run({
            query: {},
            method: HttpMethod.get,
            url: `/v1.0/users/${userId}/devices`,
        });
        return (list.data?.result || []).map((item: any) => {
            return new CommandDeviceTuyaAdater({
                id: item.id,
                name: item.name,
                query: this.query,
            });
        });
    }
}

export {
    TuyaManager,
    TuyaQuery,
    TuyaQueryConstructor,
    TuyaAuthToken,
    CommandDeviceTuyaAdater,
}