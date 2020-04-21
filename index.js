const _ = require('rubico')
const url = require('url')
const querystring = require('querystring')

const uri = {}

// string|Url => Url
const toUrl = _.switch.sync(_.is(url.Url), _.id, url.parse)

// string|Url => string
uri.getConnector = _.flow.sync(
  toUrl,
  _.get('hostname'),
  _.split(':'),
  _.get(0),
  _.switch.sync(_.eq.sync('', _.id), () => undefined, _.id)
)
_.setName(uri.getConnector, 'getConnector')


// string|Url => string
uri.getDatatype = _.flow.sync(
  toUrl,
  _.get('hostname'),
  _.split(':'),
  _.get(1),
  _.switch.sync(_.eq.sync('', _.id), () => undefined, _.id)
)
_.setName(uri.getDatatype, 'getDatatype')

// string|Url => string
uri.getEnv = _.flow.sync(
  toUrl,
  _.get('hostname'),
  _.split(':'),
  _.get(2),
  _.switch.sync(_.eq.sync('', _.id), () => undefined, _.id)
)
_.setName(uri.getEnv, 'getEnv')

// string|Url => [string]
uri.getCredentials = _.flow.sync(
  toUrl,
  _.get('auth'),
  _.switch.sync(_.id, _.split(':'), []),
)
_.setName(uri.getCredentials, 'getCredentials')

// string|Url => string
uri.getSearch = key => {
  const ret = _.flow.sync(
    toUrl,
    _.get('query'),
    querystring.parse,
    _.get(key),
  )
  _.setName(ret, `getSearch(${_.inspect(key)})`)
  return ret
}
_.setName(uri.getSearch, 'getSearch')

// string|Url => string
uri.getEndpoint = uri.getSearch('endpoint')
_.setName(uri.getEndpoint, 'getEndpoint')

// string|Url => string
uri.getRegion = uri.getSearch('region')
_.setName(uri.getRegion, 'getRegion')

// string|Url => string
uri.getSchema = uri.getSearch('schema')
_.setName(uri.getSchema, 'getSchema')

/* for later
_.switch.sync(
  _.eq.sync('dynamo', _.get('connector')),
  'http://localhost:8000',
  _.eq.sync('elasticsearch', _.get('connector')),
  'http://localhost:9200',
  _.eq.sync('redis', _.get('connector')),
  'redis://localhost:6379',
  _.eq.sync('mongo', _.get('connector')),
  'mongodb://localhost:27017/default',
  _.eq.sync('s3', _.get('connector')),
  'http://localhost:9000',
  _.eq.sync('gremlin', _.get('connector')),
  'ws://localhost:8182/gremlin',
  _.flow.sync(
    _.get('connector'),
    x => new TypeError(`invalid connector ${x}`),
    _.throw,
  ),
),
*/

// string|Url => object
uri.decode = _.flow.sync(
  url.parse,
  _.diverge.sync({
    uri: _.get('href'),
    connector: uri.getConnector,
    env: uri.getEnv,
    prefix: _.flow.sync(_.get('pathname'), _.slice(1)),
    credentials: uri.getCredentials,
    endpoint: uri.getEndpoint,
    datatype: uri.getDatatype,
    region: uri.getRegion,
    schema: uri.getSchema,
  }),
  _.filter.sync(_.exists),
)
_.setName(uri.decode, 'decode')

// object => object
uri.encode = _.flow.sync(
  _.switch.sync(_.has('connector'), _.id, _.flow.sync(
    x => new Error(`connector required: ${_.inspect(x)}`),
    _.throw,
  )),
  _.diverge.sync([
    'chimaera://',
    _.flow.sync(
      _.get('credentials'),
      _.switch.sync(
        _.isArray,
        _.flow.sync(_.join(':'), x => `${x}@`),
        '',
      ),
    ),
    _.flow.sync(
      _.diverge.sync([
        _.get('connector', ''),
        _.get('datatype', ''),
        _.get('env', ''),
      ]),
      _.join(':'),
      x => `[${x}]/`
    ),
    _.get('prefix', ''),
    _.flow.sync(
      _.pick('endpoint', 'datatype', 'region', 'schema'),
      _.switch.sync(
        _.not.sync(_.isEmpty),
        _.flow.sync(querystring.encode, x => `?${x}`),
        '',
      ),
    ),
  ]),
  _.join(''),
)

// object => object
uri.encodePublic = _.flow.sync(
  _.switch.sync(_.has('connector'), _.id, _.flow.sync(
    x => new Error(`connector required: ${_.inspect(x)}`),
    _.throw,
  )),
  _.diverge.sync([
    'chimaera://',
    _.flow.sync(
      _.diverge.sync([
        _.get('connector', ''),
        _.get('datatype', ''),
        _.get('env', ''),
      ]),
      _.join(':'),
      x => `[${x}]/`
    ),
    _.get('prefix', ''),
  ]),
  _.join(''),
)

module.exports = uri
