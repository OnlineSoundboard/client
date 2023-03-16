import { describe, expect, it } from 'vitest'
import { OSBError } from '../src/index'

describe('OSBError', () => {
  it('should be created from a code', () => {
    const code = OSBError.Errors.Timeout
    const osberr = new OSBError(code)
    expect(osberr.code).toBe(code)
  })
  it('should be created from an Error instance', () => {
    const err = new Error('from error')
    const osberr = new OSBError(err)
    expect(osberr.name).toBe('OSBError')
    expect(osberr.code).toBe(-1)
    expect(osberr.message).toBe(err.message)
    expect(osberr.cause).toBe(err.cause)
  })
  it('should be created from an OSBError instance', () => {
    const code = OSBError.Errors.Timeout
    const err = new OSBError(code, 'arg')
    const osberr = new OSBError(err)
    expect(osberr.name).toBe('OSBError')
    expect(osberr.code).toBe(err.code)
    expect(osberr.message).toBe(err.message)
    expect(osberr.cause).toBe(err.cause)
  })
  it('should be created from an OSBErrorSerialized object', () => {
    const code = OSBError.Errors.Timeout
    const errjson = new OSBError(code, 'arg').toJSON()
    const osberr = new OSBError(errjson)
    expect(osberr.name).toBe(errjson.name)
    expect(osberr.code).toBe(errjson.code)
    expect(osberr.message).toBe(errjson.message)
    expect(osberr.cause).toBe(errjson.cause)
  })
  it('should correctly set errors messages', () => {
    Object.entries(OSBError.Errors).forEach((e) => {
      const code = e[1] as number
      const err = new OSBError(code)
      expect(err.message).toBe(OSBError.Messages[code])
      expect(String(err)).toBe(`[OSBError: ${OSBError.Messages[code]}]`)
    })
  })
  it('should set unknown error', () => {
    const code = 5942
    const err = new OSBError(code)
    expect(err.message).toBe(OSBError.Messages[OSBError.Errors.Unknown])
    expect(String(err)).toBe(`[OSBError: ${OSBError.Messages[OSBError.Errors.Unknown]}]`)
  })
})
