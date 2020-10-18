// @ts-check
import ArgumentError from './ArgumentError'
import MockVerificationError from './MockVerificationError'

type Predicate = (...args: unknown[]) => boolean
interface MockedCall {
  retval: unknown
  args?: unknown[]
  predicate?: Predicate
}
interface MockedCallMap {
  [P: string]: MockedCall[]
}

/**
 * @property {MockedCallMap} expectedCalls expected calls
 * @property {MockedCallMap} actualCalls actual calls
 *
 * @class Mock
 */
class Mock {
  [name: string]: unknown

  public expectedCalls: MockedCallMap
  public actualCalls: MockedCallMap

  public constructor() {
    this.expectedCalls = {}
    this.actualCalls = {}
  }

  /**
   * Helper to stringify the input args
   *
   * @param {unknown} args
   * @returns {string}
   * @memberof Mock
   */
  public __print(args: unknown): string {
    return JSON.stringify(args)
  }

  /**
   * Mock a call to a method
   *
   * @param {string} name the method name
   * @param {unknown} retval the desired return value
   * @param {unknown[]} [args=[]] the expected arguments, or an empty array if predicate is given
   * @param {Predicate|undefined} [predicate=undefined] function to call with the arguments to test a match
   * @memberof Mock
   */
  public expect(
    name: string,
    retval: unknown,
    args: unknown[] = [],
    predicate?: Predicate
  ): void | never {
    if (predicate instanceof Function) {
      if (args && (!Array.isArray(args) || args.length > 0)) {
        throw new ArgumentError(
          `args ignored when predicate is given (args: ${this.__print(args)})`
        )
      }
      this.expectedCalls[name] = this.expectedCalls[name] || []
      this.expectedCalls[name].push({ retval, predicate })
      return
    }

    if (!Array.isArray(args)) {
      throw new ArgumentError('args must be an array')
    }
    this.expectedCalls[name] = this.expectedCalls[name] || []
    this.expectedCalls[name].push({ retval, args })
  }

  /**
   * Verifies that all expected calls have actually been called
   *
   * @memberof Mock
   * @throws {Error} if an expected call has not been registered
   * @returns {true} returns if verified, throws otherwise
   */
  public verify(): true {
    Object.keys(this.expectedCalls).forEach((name): void => {
      const expected = this.expectedCalls[name]
      const actual = this.actualCalls[name]
      if (!actual) {
        throw new MockVerificationError(
          `expected ${this.__print_call(name, expected[0])}`
        )
      }
      if (actual.length < expected.length) {
        throw new MockVerificationError(
          `expected ${this.__print_call(
            name,
            expected[actual.length]
          )}, got [${this.__print_call(name, actual)}]`
        )
      }
    })

    return true
  }

  /**
   * Alias for {reset}
   */
  public clear(): void {
    this.reset()
  }

  /**
   * Resets all the expected and actual calls
   * @memberof Mock
   */
  public reset(): void {
    this.expectedCalls = {}
    this.actualCalls = {}
  }

  /**
   * Helper to print out an expected call
   *
   * @param {string} name
   * @param {unknown} data
   * @returns
   * @private
   * @memberof Mock
   */
  // eslint-disable-next-line @typescript-eslint/camelcase
  public __print_call(
    name: string,
    data:
      | Pick<MockedCall, 'args' | 'retval'>
      | Pick<MockedCall, 'args' | 'retval'>[]
  ): string {
    if (Array.isArray(data)) {
      return data.map((d): string => this.__print_call(name, d)).join(', ')
    }

    return `${name}(${(data.args || []).join(
      ', '
    )}) => ${typeof data.retval} (${data.retval})`
  }

  /**
   * Compare two arguments for equality
   *
   * @param {[unknown, unknown]} args
   * @returns {boolean}
   * @memberof Mock
   */
  public __compare([left, right]: [unknown, unknown]): boolean {
    // TODO: implement case equality
    return left === right
  }

  /**
   * No-op in case this was wrapped in a Promise and a caller is checking if it's
   * thenable. In this case return self.
   *
   * @returns {Mock}
   * @memberof Mock
   */
  public then(): this {
    return this
  }

  /**
   * Called when the mock is called as a function
   *
   * @param {string} name the original function name
   * @param  {...unknown} actualArgs the original arguments
   */
  public __call(name: string, ...actualArgs: unknown[]): unknown {
    const actualCalls = (this.actualCalls[name] = this.actualCalls[name] || [])
    const index = actualCalls.length
    const expectedCall = (this.expectedCalls[name] || [])[index]

    if (!expectedCall) {
      throw new MockVerificationError(
        `No more (>= ${index}) expects available for ${name}: ${this.__print(
          actualArgs
        )} (${this.__print(this)})`
      )
    }

    const { args: maybeExpectedArgs, retval, predicate } = expectedCall

    if (predicate) {
      actualCalls.push(expectedCall)
      if (!predicate(...actualArgs)) {
        throw new MockVerificationError(
          `mocked method ${name} failed predicate w/ ${this.__print(
            actualArgs
          )}`
        )
      }

      return retval
    }

    const expectedArgs = maybeExpectedArgs as unknown[]

    if (expectedArgs.length !== actualArgs.length) {
      throw new MockVerificationError(
        `mocked method ${name} expects ${expectedArgs.length}, got ${actualArgs.length}`
      )
    }

    const zippedArgs = expectedArgs.map((arg, i): [unknown, unknown] => [
      arg,
      actualArgs[i]
    ]) as [unknown, unknown][]
    // Intentional == to coerce
    // TODO: allow for === case equailty style matching later
    const fullyMatched = zippedArgs.every(this.__compare)

    if (!fullyMatched) {
      throw new MockVerificationError(
        `mocked method ${name} called with unexpected arguments ${this.__print(
          actualArgs
        )}, expected ${this.__print(expectedArgs)}`
      )
    }

    actualCalls.push({
      retval,
      args: actualArgs
    })

    return retval
  }
}

const KNOWN = [
  // The following are called by runtimes whenever they want to inspect the mock
  // itself. Whenever that happens, just pass-through.
  Symbol('util.inspect.custom').toString(),
  Symbol.toStringTag.toString(),
  'inspect',
  'valueOf',
  '$$typeof'
]
  .concat(Object.getOwnPropertyNames(Object.prototype))
  .concat(Object.getOwnPropertyNames(Mock.prototype))

const handler = {
  /**
   * Called right before a property (function or otherwise) is retrieved
   *
   * @param {Mock} mock
   * @param {string} prop
   */
  get(mock: Mock & { [P: string]: unknown }, prop: string): unknown | never {
    if (mock.hasOwnProperty(prop) || mock[prop]) {
      return mock[prop]
    }

    if (mock.expectedCalls[prop]) {
      return (...args: unknown[]): unknown => mock.__call(prop, ...args)
    }

    const name = prop.toString()
    if (KNOWN.indexOf(name) !== -1 || typeof prop === 'symbol') {
      return mock[prop]
    }

    const expectedCalls = Object.keys(mock.expectedCalls) || ['<nothing>']
    throw new ArgumentError(
      `unmocked method ${name}, expected one of ${mock.__print(expectedCalls)}`
    )
  }
}

/**
 * @property {new () => ArgumentError} ArgumentError
 * @property {new () => MockVerificationError} MockVerificationError
 */
function createMock(): Mock {
  return new Proxy(new Mock(), handler)
}

createMock.ArgumentError = ArgumentError
createMock.MockVerificationError = MockVerificationError

export default createMock as {
  (): Mock
  ArgumentError: typeof ArgumentError
  MockVerificationError: typeof MockVerificationError
}
