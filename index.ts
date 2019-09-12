interface Dvalidator {
  (rule1: InputRule, rule2?: InputRule): Dvalidator;
}

interface Filter {
  (key: string): Boolean | void;
}

interface validate {
  (target: ProxyObject, filter?: Filter): Promise<ValidateError | void>;
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

type InputRule = Rule | MessageRule | string | Validator;

interface ProxyObject {
  readonly $rules: RuleMap;
  $validate(): Promise<ValidateError | void>;
}

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

interface RuleMap {
  [propName: string]: RuleMap | Rule[];
}

const dvalidator: Dvalidator = legacyAdaptor(latestAdaptor);

export default dvalidator;

function legacyAdaptor(next: Function): Dvalidator {
  function appendDecorator(rule1: InputRule, rule2?: InputRule): Dvalidator;
  function appendDecorator(rule: InputRule, target: object, key: string): void;
  function appendDecorator(...args): Dvalidator | void {
    if (args.length >= 3) {
      const [rule, target, property] = args;
      assertRule(rule);
      proxyRules(rule, target, property);
    } else {
      return next.apply(null, args);
    }
  }
  return appendDecorator;
}

interface DecoratorElementDescriptor {
  kind: string;
  key: string;
  initializer(): any;

  [Symbol.toStringTag]: 'Descriptor';
}

function latestAdaptor(rule1: InputRule, rule2?: InputRule): Dvalidator;
function latestAdaptor(
  rule: InputRule,
  descriptor: DecoratorElementDescriptor
): DecoratorElementDescriptor;
function latestAdaptor(
  args0: InputRule,
  args1: DecoratorElementDescriptor | InputRule
): DecoratorElementDescriptor | Dvalidator {
  if (!args1 || args1[Symbol.toStringTag] !== 'Descriptor') {
    const rule = Object.assign(
      {},
      deserialize(args0),
      deserialize(<InputRule>args1)
    );
    return dvalidator.bind(null, rule);
  }

  const rule = args0;
  const { kind, key, initializer } = <DecoratorElementDescriptor>args1;
  if (kind !== 'field') {
    throw new Error('dvalidator must apply on Class Field');
  }
  assertRule(rule);
  (<DecoratorElementDescriptor>args1).initializer = function() {
    initializer.call(this);
    proxyRules(<Rule>rule, this, key);
  };
  return <DecoratorElementDescriptor>args1;
}

function assertRule(rule: InputRule) {
  if (!rule || typeof (<Rule>rule).validator !== 'function') {
    throw new Error('no rule validator provided');
  }
}

function validate(
  target: ProxyObject,
  filter: Filter
): Promise<ValidateError | void> {
  const rules = resolveRules(target, '', filter);
  return _validate(target, rules);
}

function _validate(
  target: ProxyObject,
  rules: RuleMap,
  attachedKey?: string
): Promise<ValidateError | void>;
function _validate(
  target: object,
  rules: Rule[],
  attachedKey: string
): Promise<ErrorInfo | void>;
function _validate(
  target: ProxyObject | object,
  rules: RuleMap | Rule[],
  attachedKey: string = ''
): Promise<ValidateError | ErrorInfo | void> {
  const isRoot = attachedKey === '';
  if (Array.isArray(rules) && rules.length) {
    // exec in sequence
    return rules.slice(1).reduce((lastPromise, curentRule) => {
      return lastPromise.then(() => {
        return validItem(target, curentRule, attachedKey);
      });
    }, validItem(target, rules[0], attachedKey));
  } else if (typeof rules === 'object' && rules !== null) {
    return new Promise((resolve, reject) => {
      let keys = Object.keys(rules);
      let errors: ErrorInfo[] = [];
      const fields: Fields = {};
      let finalLen = 0;
      let length = keys.length;
      keys.forEach(key => {
        _validate(
          target[key],
          rules[key],
          isRoot ? key : attachedKey + '.' + key
        )
          .then(judge)
          .catch((res: ValidateError | ErrorInfo) => {
            if ((<ValidateError>res).fields) {
              // flat nest obj
              fields[key] = (<ValidateError>res).fields;
              errors = errors.concat((<ValidateError>res).errors);
            } else {
              fields[key] = <ErrorInfo>res;
              errors.push(<ErrorInfo>res);
            }
            judge();
          });
      });

      function judge() {
        if (++finalLen === length) {
          // finally
          if (errors.length) {
            reject({ errors, fields });
          } else {
            resolve();
          }
        }
      }
    });
  } else {
    return Promise.resolve();
  }
}

function validItem(
  value: any,
  rule: Rule,
  key: string
): Promise<ErrorInfo | void> {
  let result = rule.validator(value);
  const { message } = rule;

  if (typeof result === 'boolean') {
    return result
      ? Promise.resolve()
      : Promise.reject({ key, value, message, rule });
  }

  return Promise.resolve(result).catch(res => {
    // format errorMessage
    const error: ErrorInfo = { key, value, message, rule, extra: res };
    if (typeof res === 'string') {
      error.message = res;
    }
    throw error;
  });
}

function proxyRules(rule: Rule, target: ProxyObject, property: string) {
  if (!target.$rules) {
    Object.defineProperty(target, '$rules', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: Object.create(null)
    });
    Object.defineProperty(target, '$validate', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: validate.bind(null, target)
    });
  }
  if (target.$rules[property]) {
    (<Rule[]>target.$rules[property]).push(rule);
  } else {
    target.$rules[property] = [rule];
  }
}

function deserialize(options: InputRule): Rule | MessageRule {
  if (typeof options === 'function') {
    return { validator: options };
  } else if (typeof options === 'string') {
    return { message: options || 'valid fail' };
  }
  return options;
}

function resolveRules(
  val: ProxyObject,
  key: string = '',
  filter: Filter = () => true
): RuleMap {
  if (!val || !val.$rules) {
    return;
  }

  let rules: RuleMap = {};
  Object.keys(val).forEach(k => {
    const finalKey = key ? key + '.' + k : k;
    const resolvedRules = resolveRules(val[k], finalKey, filter);

    // filter for dynamic select need validate data
    if (resolvedRules) {
      // nest rule
      rules[k] = resolvedRules;
    } else if (filter(finalKey)) {
      // plain rule
      rules[k] = val.$rules[k];
    }
  });
  return rules;
}
