interface Dvalidator {
    (rule1: InputRule, rule2?: InputRule): Dvalidator;
}
interface Filter {
    (key: string): Boolean | void;
}
interface Rule {
    validator: Validator;
    message?: string;
}
interface MessageRule {
    message: string;
}
interface Validator {
    (value: any): boolean | Promise<any> | void;
}
declare type InputRule = Rule | MessageRule | string | Validator;
interface ErrorInfo {
    key: string;
    value: string;
    message: string;
    rule: Rule;
    extra?: any;
}
interface Fields {
    [propName: string]: Fields | ErrorInfo;
}
interface ValidateError {
    errors: ErrorInfo[];
    fields: Fields;
}
declare const dvalidator: Dvalidator;
export default dvalidator;
export interface $validate {
    (filter?: Filter): Promise<ValidateError | void>;
}
