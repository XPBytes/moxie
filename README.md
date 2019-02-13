# Moxie

[![Build Status](https://travis-ci.com/XPBytes/moxie.svg?branch=master)](https://travis-ci.com/XPBytes/moxie)

[![NPM Package Version](https://badge.fury.io/js/@xpbytes%2Fmoxie.svg)](https://npmjs.org/package/@xpbytes/moxie)

Proxy implementation of a mock, based on `minitest/mock.rb`.

```
yarn add @xpbytes/moxie
```

```javascript
import createMock from '@xpbytes/movie'

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
