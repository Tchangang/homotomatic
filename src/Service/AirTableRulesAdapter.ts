import Airtable from 'airtable';
import { AirtableBase } from 'airtable/lib/airtable_base';
import { Rule } from '../Domain/RuleManager/Rule';
import { User } from '../Domain/User';

class AirServiceRulesAdapter {
    private base: AirtableBase;
    constructor(config: {
        apikey: string;
        airtableId: string;
    }) {
        Airtable.configure({
            endpointUrl: 'https://api.airtable.com',
            apiKey: config.apikey,
        });
        this.base = Airtable.base(config.airtableId);
    }
    async getUsers(): Promise<Array<User>> {
        const users =  (await this.base('login').select({
            // maxRecords: 100,
            pageSize: 100,
            view: "Grid view"
        }).firstPage()).map((value) => ({
            key: value.fields.key?.toString(),
            secret: value.fields.secret?.toString(),
            active: !!value.fields.active,
            id: value.id,
        })).filter(item => typeof item.key === 'string' && typeof item.secret === 'string'
            && typeof item.active === 'boolean' && typeof item.id === 'string');
        return users as Array<User>;
    }
    async getRules(): Promise<Array<Rule>> {
        const rules = (await this.base('rules').select({
            maxRecords: 100,
            pageSize: 100,
            view: "Grid view"
        }).firstPage()).map((value) => ({
            ...value.fields,
            active: !!value.fields.active,
            'rule-id': value.fields.id,
            id: value.id,
        }));
        const rulesIds: Record<string, Rule> = {};
        rules.forEach((rule: any) => {
            rulesIds[rule.id] = {
                id: rule.id,
                active: rule.active,
                'rule-id': rule['rule-id'],
                description: rule.description, 
                conditions: [],
                actions: [],
            };
        })
        const rulesList: Array<any> =  await new Promise((resolve) => {
            const _rulesList: Array<any> = [];
            this.base('rules-list').select({
                pageSize: 100,
                view: "Grid view"
            }).eachPage(function page(records, fetchNextPage) {
                _rulesList.push(...records.map((record: any) => ({
                    ...record.fields,
                    id: record.id,
                })));
                fetchNextPage();
            
            }, function done(err) {
                return resolve(_rulesList);
                // if (err) { console.error(err); return; }
            });
        });
        rulesList.forEach((ruleItem: any) => {
            if (typeof ruleItem['rule-id'][0] === 'string') {
                rulesIds[ruleItem['rule-id'][0]].conditions.push([
                    ruleItem.left,
                    ruleItem.operator,
                    ruleItem.targetValue,
                ]);
            }
        });
        const rulesActions = (await this.base('rules-actions').select({
            maxRecords: 100,
            pageSize: 100,
            view: "Grid view"
        }).firstPage()).map((value) => value.fields);;
        rulesActions.forEach((ruleAction: any) => {
            if (typeof ruleAction['rule-id']?.[0] === 'string') {
                rulesIds[ruleAction['rule-id'][0]].actions.push([
                    ruleAction.left,
                    ruleAction.targetValue === 'true',
                ]);
            }
        });
        return Object.values(rulesIds);
    }
}

export default AirServiceRulesAdapter;