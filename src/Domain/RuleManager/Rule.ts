type Rule = {
    id: string;
    'rule-id': string;
    description: string;
    conditions: Array<Array<string>>;
    actions: Array<Array<string | boolean>>;
    active: boolean;
}

export {
    Rule,
}