'use strict'

// Minimal shim so CJS require('safe-buffer').Buffer works under Turbopack
module.exports = {
  Buffer: require('buffer').Buffer
}


