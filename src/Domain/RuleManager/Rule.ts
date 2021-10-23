type Rule = {
    id: string;
    'rule-id': string;
    description: string;
    conditions: Array<Array<string>>;
    actions: Array<Array<string>>;
    active: boolean;
}

export {
    Rule,
}