interface vulidate {
  (rule: Validator | Rule): AppendDecorator
}

interface ProxyObject {
  readonly __rules: Map<string, Rule[]>,
  readonly $validate(): Promise<ResolvedSource[]>
}

interface Decorator {
  (target: ProxyObject, property: string): void
}

interface AppendDecorator {
  (args: string | Rule | any): Decorator
}

interface Validator {
  (value: any, source: Source): boolean | Promise<any>
}

interface Rule {
  validator: Validator;
  message?: string;
}

interface Source extends Rule {
  value: any
}

interface ResolvedSource extends Source {
  reason?: any
}