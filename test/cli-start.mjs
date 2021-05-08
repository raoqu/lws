import TestRunner from 'test-runner'
import assert from 'assert'
import LwsCli from '../lib/cli-app.mjs'
import sleep from 'sleep-anywhere'
import * as fs from 'fs/promises'
import path from 'path'
import getModulePaths from 'current-module-paths'
const __dirname = getModulePaths(import.meta.url).__dirname
const a = assert.strict

const tom = new TestRunner.Tom()

tom.test('bad option, should fail and printError', async function () {
  const origArgv = process.argv.slice()
  const origExitCode = process.exitCode
  process.argv = ['node', 'something', '--should-fail']
  let logMsg = ''
  const cli = new LwsCli({
    logError: function (msg) { logMsg = msg }
  })
  cli.start()
  a.ok(/--should-fail/.test(logMsg))
  process.argv = origArgv
  process.exitCode = origExitCode
})

tom.test('port not available', async function () {
  const port = 7500 + this.index
  const actuals = []
  const origArgv = process.argv.slice()
  const origExitCode = process.exitCode
  process.argv = ['node', 'something', '--port', `${port}`]
  const cli = new LwsCli({ logError: function () {} })
  const server = cli.start()
  const server2 = cli.start()
  server2.on('error', err => {
    actuals.push(err.message)
    server.close()
    server2.close()
  })
  await sleep(10)
  a.deepEqual(actuals.length, 1)
  a.ok(/EADDRINUSE/.test(actuals[0]))
  process.argv = origArgv
  process.exitCode = origExitCode
})

tom.test('--help', async function () {
  const origArgv = process.argv.slice()
  process.argv = ['node', 'something', '--help']
  let usage = null
  const cli = new LwsCli({
    log: function (msg) {
      usage = msg
    }
  })
  cli.start()
  process.argv = origArgv
  a.ok(/Synopsis/.test(usage))
})

tom.test('--version', async function () {
  let logMsg = ''
  const cli = new LwsCli({
    log: function (msg) { logMsg = msg }
  })
  cli.start(['--version'])
  const version = JSON.parse(await fs.readFile(path.resolve(__dirname, '..', 'package.json'), 'utf8')).version
  a.equal(version, logMsg.trim())
})

tom.test('--config', async function () {
  let logMsg = ''
  const cli = new LwsCli({
    log: function (msg) { logMsg = msg }
  })
  cli.start(['--config', '--https'])
  a.ok(/https/.test(logMsg))
})

tom.test('--list-network-interfaces', async function () {
  let logMsg = ''
  const cli = new LwsCli({
    log: function (msg) { logMsg = msg }
  })
  cli.start(['--list-network-interfaces'])
  a.ok(/Available network interfaces/.test(logMsg))
  a.ok(/en0/.test(logMsg))
})

if (process.env.TESTOPEN) {
  tom.test('--open', async function () {
    const cli = new LwsCli({
      log: function () { }
    })
    const server = cli.start(['--open'])
    server.close()
  })

  tom.test('--open --https', async function () {
    const cli = new LwsCli({
      log: function () { }
    })
    const server = cli.start(['--open', '--https'])
    server.close()
  })
}

export default tom
