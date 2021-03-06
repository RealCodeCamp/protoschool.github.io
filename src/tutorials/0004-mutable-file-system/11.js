import all from 'it-all'

import utils from '../utils'

const validate = async (result, ipfs) => {
  const rootDirectoryContents = await all(ipfs.files.ls('/'))
  const rootDirectoryStatus = await ipfs.files.stat('/')
  const rootIsEmpty = rootDirectoryStatus.cid && rootDirectoryStatus.cid.toString() === 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn'

  let rootContainsSome = rootDirectoryContents.length === 1 && rootDirectoryContents[0].name === 'some'
  let someContainsStuff = null
  let someIsEmpty = null
  let someDirectoryContents = null

  if (rootContainsSome) {
    someDirectoryContents = await all(ipfs.files.ls('/some'))
    someContainsStuff = someDirectoryContents.length === 1 && someDirectoryContents[0].name === 'stuff'
    someIsEmpty = someDirectoryContents.length === 0
  }

  if (!result) {
    return { fail: utils.validationMessages.NO_RESULT }
  } else if (result instanceof Error && result.code === utils.ipfs.errorCodes.ERR_WAS_DIR) {
    return {
      fail: 'Oops! You tried to remove a non-empty directory and it didn\'t work because you forgot to use `{ recursive: true }`.',
      overrideError: true
    }
  } else if (utils.validators.isAsyncIterable(result)) {
    return {
      fail: utils.validationMessages.VALUE_IS_ASYNC_ITERABLE_ALL
    }
  } else if (!rootDirectoryStatus.cid) {
    return { fail: 'Your root directory doesn\'t look right. Are you sure you ran the `files.rm` method on your `/some` directory with the option `{ recursive: true }`?' }
  } else if (result instanceof Error && result.code === utils.ipfs.errorCodes.ERR_INVALID_PARAMS && result.message.includes('root')) {
    return {
      fail: 'Oops! Your root directory can\'t be removed. Remove `/some` instead.',
      overrideError: true
    }
  } else if (rootContainsSome && someIsEmpty) {
    // only removed /some/stuff with {recursive:true} or tried to remove the root itself
    return {
      fail: 'Oops! You removed `/some/stuff` but `/some` is still in your root directory.'
    }
  } else if (rootContainsSome && someContainsStuff) {
    return {
      fail: 'You still have a `/some/stuff` directory. Be sure to run the `files.rm` method on your `/some` directory with the option `{ recursive: true }`'
    }
  } else if (!(result instanceof Error) && !rootIsEmpty) {
    // only removed /some/stuff with {recursive:true} or tried to remove the root itself
    return {
      fail: 'Your root directory isn\'t empty. Are you sure you ran the `files.rm` method on your `/some` directory with the option `{ recursive: true }`?',
      logDesc: 'Here are the current contents of your root directory:',
      log: rootDirectoryContents.map(utils.format.ipfsObject)
    }
  } else if (rootIsEmpty) {
    return {
      success: 'Success! You\'ve completed this series of lessons!',
      logDesc: "Your function returned an empty array (`[]`) as there is no content in your root directory. Its status (`stat`) is shown below. Note that we're back to exactly the same CID we started with!",
      log: utils.format.ipfsObject(rootDirectoryStatus)
    }
  }
}

const code = `/* global ipfs, all */

const run = async (files) => {
  await Promise.all(files.map(f => ipfs.files.write('/' + f.name, f, { create: true })))
  await ipfs.files.mkdir('/some/stuff', { parents: true })
  let rootDirectoryContents = await all(ipfs.files.ls('/'))
  const filepathsToMove = rootDirectoryContents.filter(file => file.type === 0).map(file => '/' + file.name)
  await ipfs.files.mv(filepathsToMove, '/some/stuff')
  await ipfs.files.cp('/ipfs/QmWCscor6qWPdx53zEQmZvQvuWQYxx1ARRCXwYVE4s9wzJ', '/some/stuff/success.txt')
  let someStuffDirectoryContents = await all(ipfs.files.ls('/some/stuff'))

  // Your code goes here

  let finalRootDirectoryContents = await all(ipfs.files.ls('/'))
  return finalRootDirectoryContents
}

return run
`

const solution = `/* global ipfs, all */

const run = async (files) => {
  await Promise.all(files.map(f => ipfs.files.write('/' + f.name, f, { create: true })))
  await ipfs.files.mkdir('/some/stuff', { parents: true })
  let rootDirectoryContents = await all(ipfs.files.ls('/'))
  const filepathsToMove = rootDirectoryContents.filter(file => file.type === 0).map(file => '/' + file.name)
  await ipfs.files.mv(filepathsToMove, '/some/stuff')
  await ipfs.files.cp('/ipfs/QmWCscor6qWPdx53zEQmZvQvuWQYxx1ARRCXwYVE4s9wzJ', '/some/stuff/success.txt')
  let someStuffDirectoryContents = await all(ipfs.files.ls('/some/stuff'))

  await ipfs.files.rm('/some', { recursive: true })

  let finalRootDirectoryContents = await all(ipfs.files.ls('/'))
  return finalRootDirectoryContents
}

return run
`

const options = {
  overrideErrors: true,
  createTestFile: true
}

export default {
  validate,
  code,
  solution,
  options
}
