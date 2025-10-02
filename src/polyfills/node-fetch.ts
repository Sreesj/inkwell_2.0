// Polyfill fetch, Headers, Request, Response in Node runtime for Turbopack
import fetchOrig, { Headers as HeadersOrig, Request as RequestOrig, Response as ResponseOrig } from 'node-fetch'

declare global {
  // eslint-disable-next-line no-var
  var fetch: typeof fetchOrig | undefined
  // eslint-disable-next-line no-var
  var Headers: typeof HeadersOrig | undefined
  // eslint-disable-next-line no-var
  var Request: typeof RequestOrig | undefined
  // eslint-disable-next-line no-var
  var Response: typeof ResponseOrig | undefined
}

if (typeof global.fetch === 'undefined') {
  ;(global as any).fetch = fetchOrig as any
}
if (typeof global.Headers === 'undefined') {
  ;(global as any).Headers = HeadersOrig as any
}
if (typeof global.Request === 'undefined') {
  ;(global as any).Request = RequestOrig as any
}
if (typeof global.Response === 'undefined') {
  ;(global as any).Response = ResponseOrig as any
}

export {}


