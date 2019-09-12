export interface dvalidator {
  (rule: Validator | Rule): AppendDecorator
}

export interface validate {
  (target: ProxyObject, filter?: Filter): Promise<ValidateError[] | void>
}

interface Filter {
  (key: string): Boolean | void
}

interface Rule {
  validator: Validator
  message?: string
}

interface AppendDecorator {
  (rule: string | Rule | void): AppendDecorator
  (target: object, key: string): void
}

interface ProxyObject {
  readonly $rules: RuleMap
  $validate(): Promise<ValidateError[] | void>
}

type RuleMap = Map<string, Rule[]>

interface Validator {
  (value: any): boolean | Promise<any> | void
}

interface ValidateError {
  key: string
  value: string
  message: string
  rule: Rule
  extra?: any
}
