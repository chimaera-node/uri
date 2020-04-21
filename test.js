const _ = require('rubico')
const a = require('a-sert')
const uri = require('.')

describe('uri', () => {
  describe('getConnector', () => {
    it('gets connector from a base uri', () => _.flow(
      a.eq('dynamo', uri.getConnector),
    )('chimaera://[dynamo::]/my_table'))

    it('gets connector from a env uri', () => _.flow(
      a.eq('s3', uri.getConnector),
    )('chimaera://[s3::dev]/my_bucket'))

    it('=> undefined for an empty uri', () => _.flow(
      a.eq(undefined, uri.getConnector),
    )('chimaera://[]'))
  })

  describe('getDatatype', () => {
    it('gets datatype from a base uri', () => _.flow(
      a.eq('sorted_set', uri.getDatatype),
    )('chimaera://[redis:sorted_set:dev]/my_sorted_set'))

    it('=> undefined from a dynamo uri', () => _.flow(
      a.eq(undefined, uri.getDatatype),
    )('chimaera://[dynamo::dev]/my_table'))
  })

  describe('getEnv', () => {
    it('gets env from an env uri', () => _.flow(
      a.eq('dev', uri.getEnv),
    )('chimaera://[s3::dev]/my_bucket'))

    it('=> undefined for a base uri', () => _.flow(
      a.eq(undefined, uri.getEnv),
    )('chimaera://[dynamo::]/my_table'))
  })

  describe('getCredentials', () => {
    it('gets credentials from an auth uri', () => _.flow(
      a.eq(['user', 'secret'], uri.getCredentials),
    )('chimaera://user:secret@[dynamo::dev]/my_table'))

    it('=> [] for a non auth uri', () => _.flow(
      a.eq([], uri.getCredentials),
    )('chimaera://[dynamo::dev]/my_table'))
  })

  describe('getEndpoint', () => {
    it('gets endpoint from a uri with qs', () => _.flow(
      a.eq('http://localhost:8000', uri.getEndpoint),
    )(`chimaera://[dynamo::dev]/my_table?endpoint=${encodeURIComponent('http://localhost:8000')}`))

    it('=> undefined from a uri without qs', () => _.flow(
      a.eq(undefined, uri.getEndpoint),
    )(`chimaera://[dynamo::dev]/my_table`))
  })

  describe('getRegion', () => {
    it('gets region from a uri with qs', () => _.flow(
      a.eq('us-east-1', uri.getRegion),
    )('chimaera://[dynamo::dev]/my_table?region=us-east-1'))

    it('gets undefined from a uri without qs', () => _.flow(
      a.eq(undefined, uri.getRegion),
    )('chimaera://[dynamo::dev]/my_table'))
  })

  describe('getSchema', () => {
    it('gets schema from a uri with qs', () => _.flow(
      a.eq('dynamo_minimal', uri.getSchema),
    )('chimaera://[dynamo::dev]/my_table?schema=dynamo_minimal'))

    it('gets undefined from a uri without qs', () => _.flow(
      a.eq(undefined, uri.getSchema),
    )('chimaera://[dynamo::dev]/my_table'))
  })

  describe('decode', () => {
    it('decodes a chimaera dynamo uri', () => _.flow(
      uri.decode,
      a.eq(
        `chimaera://id:secret@[dynamo::local]/my_table?region=x-x-x&schema=dynamo_minimal&endpoint=${encodeURIComponent('http://localhost:8000')}`,
        _.get('uri'),
      ),
      a.eq('dynamo', _.get('connector')),
      a.eq('local', _.get('env')),
      a.eq('my_table', _.get('prefix')),
      a.eq(['id', 'secret'], _.get('credentials')),
      a.eq('http://localhost:8000', _.get('endpoint')),
      a.eq('x-x-x', _.get('region')),
      a.eq('dynamo_minimal', _.get('schema')),
    )(`chimaera://id:secret@[dynamo::local]/my_table?region=x-x-x&schema=dynamo_minimal&endpoint=${encodeURIComponent('http://localhost:8000')}`))
  })

  describe('encode', () => {
    it('encodes a chimaera dynamo uri', () => _.flow(
      a.eq(
        `chimaera://id:secret@[dynamo::local]/my_table?endpoint=${encodeURIComponent('http://localhost:8000')}&region=x-x-x&schema=dynamo_minimal`,
        uri.encode,
      ),
    )({
      connector: 'dynamo',
      env: 'local',
      prefix: 'my_table',
      credentials: ['id', 'secret'],
      endpoint: 'http://localhost:8000',
      region: 'x-x-x',
      schema: 'dynamo_minimal',
    }))

    it('encodes a minimal uri', () => _.flow(
      a.eq('chimaera://[elasticsearch::]/', uri.encode),
    )({ connector: 'elasticsearch' }))

    it('encodes an s3 uri', () => _.flow(
      a.eq('chimaera://id:secret@[s3::dev]/my_bucket?region=us-east-1', uri.encode),
    )({
      connector: 's3',
      env: 'dev',
      prefix: 'my_bucket',
      credentials: ['id', 'secret'],
      region: 'us-east-1',
    }))
  })

  describe('encodePublic', () => {
    it('encodes a public chimaera dynamo uri', () => _.flow(
      a.eq(
        `chimaera://[dynamo::local]/my_table`,
        uri.encodePublic,
      ),
    )({
      connector: 'dynamo',
      env: 'local',
      path: '/my_table',
      credentials: ['id', 'secret'],
      endpoint: 'http://localhost:8000',
      region: 'x-x-x',
      schema: 'dynamo_minimal',
    }))

    it('encodes a minimal uri', () => _.flow(
      a.eq('chimaera://[elasticsearch::]/', uri.encodePublic),
    )({ connector: 'elasticsearch' }))

    it('encodes an s3 uri', () => _.flow(
      a.eq('chimaera://[s3::dev]/my_bucket', uri.encodePublic),
    )({
      connector: 's3',
      env: 'dev',
      path: '/my_bucket',
      credentials: ['id', 'secret'],
      region: 'us-east-1',
    }))
  })
})
