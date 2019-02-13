// @ts-check

class ArgumentError extends Error {
  constructor(message: string) {
    super(message)

    Error.captureStackTrace(this, this.constructor)
  }
}

class MockVerificationError extends Error {
  constructor(message: string) {
    super(message)

    Error.captureStackTrace(this, this.constructor)
  }
}

type Predicate = (...args: any[]) => boolean
type MockedCall = { retval: any, args?: any[], predicate?: Predicate }

/**
 * @property {{ [P: string]: MockedCall[] }} expected_calls expected calls
 * @property {{ [P: string]: MockedCall[] }} actual_calls actual calls
 *
 * @class Mock
 */
class Mock {
  expected_calls: { [P: string]: MockedCall[] }
  actual_calls: { [P: string]: MockedCall[] }

  constructor() {
    this.expected_calls = {}
    this.actual_calls = {}
  }

  /**
   * Helper to stringify the input args
   *
   * @param {any} args
   * @returns {string}
   * @memberof Mock
   */
  __print(args: any): string {
    return JSON.stringify(args)
  }

  /**
   * Mock a call to a method
   *
   * @param {string} name the method name
   * @param {any} retval the desired return value
   * @param {any[]} [args=[]] the expected arguments, or an empty array if predicate is given
   * @param {Predicate|undefined} [predicate=undefined] function to call with the arguments to test a match
   * @memberof Mock
   */
  expect(name: string, retval: any, args: any[] = [], predicate: Predicate = undefined) {
    if (predicate instanceof Function) {
      if (args && (!Array.isArray(args) || args.length > 0)) {
        throw new ArgumentError(`args ignored when predicate is given (args: ${this.__print(args)})`)
      }
      this.expected_calls[name] = this.expected_calls[name] || []
      this.expected_calls[name].push({ retval, predicate })
      return
    }

    if (!Array.isArray(args)) {
      throw new ArgumentError("args must be an array")
    }
    this.expected_calls[name] = this.expected_calls[name] || []
    this.expected_calls[name].push({ retval, args })
  }

  /**
   * Verifies that all expected calls have actually been called
   *
   * @memberof Mock
   * @throws {Error} if an expected call has not been registered
   * @returns {true} returns if verified, throws otherwise
   */
  verify(): true {
    Object.keys(this.expected_calls).forEach((name) => {
      const expected = this.expected_calls[name]
      const actual = this.actual_calls[name]
      if (!actual) {
        throw new MockVerificationError(
          `expected ${this.__print_call(name, expected[0])}`
        )
      }
      if (actual.length < expected.length) {
        throw new MockVerificationError(
          `expected ${this.__print_call(name, expected[actual.length])}, got [${this.__print_call(name, actual)}]`
        )
      }
    })

    return true
  }

  /**
   * Alias for {reset}
   */
  clear() {
    this.reset()
  }

  /**
   * Resets all the expected and actual calls
   * @memberof Mock
   */
  reset() {
    this.expected_calls = {}
    this.actual_calls = {}
  }

  /**
   * Helper to print out an expected call
   *
   * @param {string} name
   * @param {any} data
   * @returns
   * @private
   * @memberof Mock
   */
  __print_call(name: string, data: any): string {
    if (Array.isArray(data)) {
      return data.map((d) => this.__call(name, d)).join(', ')
    }

    return `${name}(${(data.args || []).join(', ')}) => ${typeof data.retval} (${data.retval})`
  }

  /**
   * Compare two arguments for equality
   *
   * @param {[any, any]} args
   * @returns {boolean}
   * @memberof Mock
   */
  __compare([left, right]: [any, any]): boolean {
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
  then(): this {
    return this
  }

  /**
   * Called when the mock is called as a function
   *
   * @param {string} name the original function name
   * @param  {...any} actual_args the original arguments
   */
  __call(name: string, ...actual_args: any[]) {
    const actual_calls = this.actual_calls[name] = this.actual_calls[name] || []
    const index = actual_calls.length
    const expected_call = (this.expected_calls[name] || [])[index]

    if (!expected_call) {
      throw new MockVerificationError(
        `No more (>= ${index}) expects available for ${name}: ${this.__print(actual_args)} (${this.__print(this)})`
        )
    }

    const { args: expected_args, retval, predicate } = expected_call

    if (predicate) {
      actual_calls.push(expected_call)
      if (!predicate(...actual_args)) {
        throw new MockVerificationError(
          `mocked method ${name} failed predicate w/ ${this.__print(actual_args)}`
        )
      }

      return retval
    }

    if (expected_args.length !== actual_args.length) {
      throw new MockVerificationError(
        `mocked method ${name} expects ${expected_args.length}, got ${actual_args.length}`
      )
    }

    const zipped_args = expected_args.map((arg, i) => [arg, actual_args[i]])
    // Intentional == to coerce
    // TODO: allow for === case equailty style matching later
    const fully_matched = zipped_args.every(this.__compare)

    if (!fully_matched) {
      throw new MockVerificationError(
        `mocked method ${name} called with unexpected arguments ${this.__print(actual_args)}, expected ${this.__print(expected_args)}`
      )
    }

    actual_calls.push({
      retval,
      args: actual_args
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
  '$$typeof',
]
.concat(Object.getOwnPropertyNames(Object.prototype))
.concat(Object.getOwnPropertyNames(Mock.prototype))

const __handler = {
  /**
   * Called right before a property (function or otherwise) is retrieved
   *
   * @param {Mock} mock
   * @param {string} prop
   */
  get: function(mock: Mock, prop: string) {
    if (mock.hasOwnProperty(prop) || mock[prop]) {
      return mock[prop]
    }

    if (mock.expected_calls[prop]) {
      return (...args: any[]) => mock.__call(prop, ...args)
    }

    const name = prop.toString()
    if (KNOWN.indexOf(name) !== -1 || typeof prop === 'symbol') {
      return mock[prop]
    }

    const expected_calls = Object.keys(mock.expected_calls) || ['<nothing>']
    throw new Error(
      `unmocked method ${name}, expected one of ${mock.__print(expected_calls)}`
      )
  }
}

export default function createMock(): Mock {
  return new Proxy(new Mock(), __handler)
}
