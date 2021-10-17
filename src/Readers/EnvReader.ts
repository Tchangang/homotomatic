class EnvReader {
    static get() {
        if (!process.env.TUYA_BOUSCAT_CLIENTID) {
            throw new Error('Missing env TUYA_BOUSCAT_CLIENTID');
        }
        if (!process.env.TUYA_BOUSCAT_SECRET) {
            throw new Error('Missing env TUYA_BOUSCAT_SECRET');
        }
        if (!process.env.SWITCHBOT_BOUSCAT_TOKEN) {
            throw new Error('Missing env SWITCHBOT_BOUSCAT_TOKEN');
        }
        if (!process.env.TUYA_USERID) {
            throw new Error('Missing env TUYA_USERID');
        }
        if (!process.env.EWELINK_EMAIL) {
            throw new Error('Missing env EWELINK_EMAIL');
        }
        if (!process.env.EWELINK_PASSWORD) {
            throw new Error('Missing env EWELINK_PASSWORD');
        }
        if (!process.env.EWELINK_REGION) {
            throw new Error('Missing env EWELINK_REGION');
        }
        return {
            TUYA_CLIENT_ID: process.env.TUYA_BOUSCAT_CLIENTID,
            TUYA_CLIENT_SECRET: process.env.TUYA_BOUSCAT_SECRET,
            TUYA_USER_ID: process.env.TUYA_USERID,
            SWITCHBOT_TOKEN: process.env.SWITCHBOT_BOUSCAT_TOKEN,
            EWELINK_EMAIL: process.env.EWELINK_EMAIL,
            EWELINK_PASSWORD: process.env.EWELINK_PASSWORD,
            EWELINK_REGION: process.env.EWELINK_REGION,
        }
    }
}

export default EnvReader;