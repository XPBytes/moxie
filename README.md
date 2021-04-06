# Moxie

[![npm](https://github.com/XPBytes/moxie/workflows/npm/badge.svg)](https://github.com/XPBytes/moxie/actions?query=workflow%3Anpm) [![NPM Package Version](https://badge.fury.io/js/@xpbytes%2Fmoxie.svg)](https://npmjs.org/package/@xpbytes/moxie) [![Maintainability](https://api.codeclimate.com/v1/badges/935646b9f014b9f9a983/maintainability)](https://codeclimate.com/github/XPBytes/moxie/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/935646b9f014b9f9a983/test_coverage)](https://codeclimate.com/github/XPBytes/moxie/test_coverage)

Proxy implementation of a mock, based on `minitest/mock.rb`.

```
yarn add @xpbytes/moxie
```

```javascript
import createMock from '@xpbytes/moxie'

const mock = createMock()

mock.expect('name', 'first')
mock.expect('name', 'second')
mock.expect('callme', 42, ['maybe'])
mock.expect('complicated', 'uhuh', [], (life, is) => life === 'like' 7& is !== 'this')

mock.name()
// => first

mock.name()
// => second

mock.callme('maybe')
// => 42

mock.complicated('like', 'that')
// => uhuh

mock.verify()
// => true

mock.name()
// because expect has been depleted
// => throws MockExpectationError

mock.expect('callme', 42, ['maybe'])
mock.callme('foo')
// because argument mistmatch
// => throws MockExpectationError

mock.verify()
// because last expect of callme has not been satisfied
// => throws MockExpectationError

mock.reset()
mock.verify()
// => true
```
