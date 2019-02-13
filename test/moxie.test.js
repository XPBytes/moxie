import test from 'ava'
import createMock from '../moxie'

const PROPERTIES = Object.getOwnPropertyNames(Object.getPrototypeOf(createMock()))

test('mocks can expect', (t) => {
  const mock = createMock()
  t.not(PROPERTIES.indexOf('expect'), -1)
  t.true(typeof mock.expect === 'function')
  t.is(mock.expect.length, 2)
})

test('mocks can verify', (t) => {
  const mock = createMock()
  t.not(PROPERTIES.indexOf('verify'), -1)
  t.true(typeof mock.verify === 'function')
  t.is(mock.verify.length, 0)
})

test('mocks can reset', (t) => {
  const mock = createMock()
  t.not(PROPERTIES.indexOf('reset'), -1)
  t.true(typeof mock.reset === 'function')
  t.is(mock.reset.length, 0)
})

test('expect with name and retval', (t) => {
  const mock = createMock()
  mock.expect('foo', 'bar')
  t.true(typeof mock.foo === 'function')
  t.is(mock.foo(), 'bar')
})

test('expect with name and retval and args', (t) => {
  const mock = createMock()
  mock.expect('foo', 'bar', [1])
  t.true(typeof mock.foo === 'function')
  t.is(mock.foo(1), 'bar')
})

test('expect with name and retval and block', (t) => {
  const mock = createMock()
  mock.expect('foo', 'bar', [], (arg) => arg === 1)
  t.true(typeof mock.foo === 'function')
  t.is(mock.foo(1), 'bar')
})

test('expect with name and retval multiple times', (t) => {
  const mock = createMock()
  mock.expect('foo', 'bar')
  mock.expect('foo', 'apple')
  t.true(typeof mock.foo === 'function')

  t.is(mock.foo(), 'bar')
  t.is(mock.foo(), 'apple')
})

test('mock throws if not expected', (t) => {
  const mock = createMock()
  t.throws(() => mock.foo())
})

test('mock throws if not enough expected', (t) => {
  const mock = createMock()
  mock.expect('foo', 'bar')
  t.is(mock.foo(), 'bar')
  t.throws(() => mock.foo())
})

test('verify is true if nothing called and expected', (t) => {
  const mock = createMock()
  t.true(mock.verify())
})

test('verify is true if expected is called', (t) => {
  const mock = createMock()
  mock.expect('foo', 'bar')
  t.is(mock.foo(), 'bar')
  t.true(mock.verify())
})

test('verify throws if expected not matched', (t) => {
  const mock = createMock()
  mock.expect('foo', 'bar')
  t.throws(() => mock.verify())
})

test('reset is no-op if nothing called and expected', (t) => {
  const mock = createMock()
  mock.reset()

  t.pass('no unexpected errors')
})

test('reset removes expectations', (t) => {
  const mock = createMock()
  mock.expect('foo', 'bar')
  mock.reset()

  t.true(mock.verify())
  t.throws(() => mock.foo())
})

test('verify is no-op if nothing called and expected', (t) => {
  const mock = createMock()
  t.true(mock.verify())
})

test('README.md sample', (t) => {

const mock = createMock()

  mock.expect('name', 'first')
  mock.expect('name', 'second')
  mock.expect('callme', 42, ['maybe'])
  mock.expect('complicated', 'uhuh', [], (life, is) => life === 'like' && is !== 'this')

  t.is(mock.name(), 'first')
  t.is(mock.name(), 'second')
  t.is(mock.callme('maybe'), 42)
  t.is(mock.complicated('like', 'that'), 'uhuh')
  t.true(mock.verify())

  t.throws(() => mock.name())

  mock.expect('callme', 42, ['maybe'])
  t.throws(() => mock.callme('foo'))
  t.throws(() => mock.verify())

  mock.reset()
  t.true(mock.verify())
})
