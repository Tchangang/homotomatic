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
        if (!process.env.AIRTABLE_HOMOTOMATIC_APIKEY) {
            throw new Error('Missing env AIRTABLE_HOMOTOMATIC_APIKEY');
        }
        if (!process.env.AIRTABLE_HOMOTOMATIC_ID) {
            throw new Error('Missing env AIRTABLE_HOMOTOMATIC_ID');
        }
        return {
            TUYA_CLIENT_ID: process.env.TUYA_BOUSCAT_CLIENTID,
            TUYA_CLIENT_SECRET: process.env.TUYA_BOUSCAT_SECRET,
            TUYA_USER_ID: process.env.TUYA_USERID,
            SWITCHBOT_TOKEN: process.env.SWITCHBOT_BOUSCAT_TOKEN,
            EWELINK_EMAIL: process.env.EWELINK_EMAIL,
            EWELINK_PASSWORD: process.env.EWELINK_PASSWORD,
            EWELINK_REGION: process.env.EWELINK_REGION,
            AIRTABLE_APIKEY: process.env.AIRTABLE_HOMOTOMATIC_APIKEY,
            AIRTABLE_TABLE_ID: process.env.AIRTABLE_HOMOTOMATIC_ID,
            REFRESH_DEVICE: process.env.REFRESH_DEVICE ? parseInt(process.env.REFRESH_DEVICE, 10) : 60000 * 3,
            REFRESH_SENSOR: process.env.REFRESH_SENSOR ? parseInt(process.env.REFRESH_SENSOR, 10) : 60000 * 3,
            CHECK_RULES: process.env.CHECK_RULES ? parseInt(process.env.CHECK_RULES, 10) : 60000 * 2,
            REFRESH_RULES: process.env.REFRESH_RULES ? parseInt(process.env.REFRESH_RULES, 10) : 60000 * 5,
            REFRESH_USERS: process.env.REFRESH_USERS ? parseInt(process.env.REFRESH_USERS, 10) : 60000 * 5,
            PORT: process.env.PORT || 8080,
        }
    }
}

export default EnvReader;