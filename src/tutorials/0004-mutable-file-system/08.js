import all from 'it-all'

import utils from '../utils'

const validate = async (result, ipfs) => {
  // check that right directories are there with no loose files in root
  let rootDirectoryContents = await all(ipfs.files.ls('/'))

  let rootIsEmpty = rootDirectoryContents.length === 0
  let rootContainsOnlySome = rootDirectoryContents.length === 1 && rootDirectoryContents[0].name === 'some'
  let someContainsOnlyStuff = null

  if (rootContainsOnlySome) {
    let someDirectoryContents = await all(ipfs.files.ls('/some'))
    someContainsOnlyStuff = someDirectoryContents.length === 1 && someDirectoryContents[0].name === 'stuff'
  }

  // identify files that should have been moved
  let uploadedFiles = window.uploadedFiles || false
  let uploadedFilenames = uploadedFiles.map(file => file.name.toString()).sort()

  // check whether user returned the contents of /some/stuff
  let someStuffFiles = null
  let returnedSomeStuffContents = null
  let someStuffFilenames = null
  let itemsMatch = null
  let itemsAreFiles = null

  if (!rootIsEmpty && rootContainsOnlySome && someContainsOnlyStuff) {
    someStuffFiles = await all(ipfs.files.ls('/some/stuff'))
    someStuffFilenames = someStuffFiles.map(file => file.name.toString()).sort()
    returnedSomeStuffContents = JSON.stringify(result) === JSON.stringify(someStuffFiles)

    // check whether contents of /some/stuff are the right files
    itemsMatch = JSON.stringify(someStuffFilenames) === JSON.stringify(uploadedFilenames)
    itemsAreFiles = someStuffFiles.every(file => file.type === 0)
  }

  if (!result) {
    return { fail: 'You forgot to return a result. Did you accidentally edit the return statement?' }
  } else if (uploadedFiles === false) {
    // Shouldn't happen because you can't hit submit without uploading files
    return { fail: 'Oops! You forgot to upload files to work with :(' }
  } else if (result instanceof Error && result.message === 'Unexpected token const') {
    return {
      fail: 'Oops! Looks like you forgot to assign a value to `filesToMove` or `filepathsToMove`',
      overrideError: true
    }
  } else if (result instanceof Error && result.message === 'await is only valid in async function') {
    return {
      fail: "Oops! `await` is only valid in an async function. Perhaps you ran `file.mv` multiple times and didn't wrap it in a single async function? See our suggestion for passing in an array so you can make a single call to `files.mv`.",
      overrideError: true
    }
  } else if (result instanceof Error && result.message === 'ipfs.mv is not a function') {
    return {
      fail: 'Oops! Did you type `ipfs.mv` instead of `ipfs.files.mv`?',
      overrideError: true
    }
  } else if (utils.validators.isAsyncIterable(result)) {
    return {
      fail: utils.validationMessages.VALUE_IS_ASYNC_ITERABLE_ALL
    }
  } else if (rootIsEmpty) {
    return { fail: 'Your root directory is empty. Did you accidentally move the `some/stuff` directory? Remember to test whether each item is a file (`type === 0`) before moving it.' }
  } else if (result instanceof Error && result.code === utils.ipfs.errorCodes.ERR_INVALID_PATH) {
    return {
      fail: 'Invalid path. Did you use just the file name when attempting to move each file? Remember to start the path with a leading `/`.',
      overrideError: true
    }
  } else if (!returnedSomeStuffContents) {
    return { fail: 'It looks like you returned something other than the contents of the `/some/stuff` directory. Did you accidentally edit the return statement?' }
  } else if (!rootContainsOnlySome) {
    return {
      fail: 'Your root directory should now contain only your `/some` directory, but something else is there.',
      logDesc: "Here's what's in your root directory:",
      log: rootDirectoryContents.map(utils.format.ipfsObject)
    }
  } else if (!someContainsOnlyStuff) {
    return {
      fail: 'Your `/some` directory should now contain only your `/stuff` directory, but something else is there.',
      logDesc: "Here's what's in your `/some` directory:",
      log: (await all(ipfs.files.ls('/some'))).map(utils.format.ipfsObject)
    }
  } else if (!itemsAreFiles) {
    return { fail: 'Uh oh. It looks like your `/some/stuff` directory contains a directory. It should only include files.' }
  } else if (!itemsMatch) {
    return { fail: "Uh oh. It looks the contents of your `/some/stuff` directory don't match your uploaded files." }
  } else if (itemsMatch && itemsAreFiles) {
    return {
      success: utils.validationMessages.SUCCESS,
      logDesc: 'This is the data that is now in your `/some/stuff` directory in IPFS:',
      log: someStuffFiles.map(utils.format.ipfsObject)
    }
  }
}

const code = `/* global ipfs, all */

const run = async (files) => {
  await Promise.all(files.map(f => ipfs.files.write('/' + f.name, f, { create: true })))
  await ipfs.files.mkdir('/some/stuff', { parents: true })
  const rootDirectoryContents = await all(ipfs.files.ls('/'))

  const filepathsToMove = // create an array of the paths of the files to be moved (excluding directories)

  // move all the files in filepathsToMove into /some/stuff

  const someStuffDirectoryContents = await all(ipfs.files.ls('/some/stuff'))
  return someStuffDirectoryContents
}

return run
`

const solution = `/* global ipfs, all */

const run = async (files) => {
  await Promise.all(files.map(f => ipfs.files.write('/' + f.name, f, { create: true })))
  await ipfs.files.mkdir('/some/stuff', { parents: true })
  const rootDirectoryContents = await all(ipfs.files.ls('/'))

  const filepathsToMove = rootDirectoryContents.filter(file => file.type === 0).map(file => '/' + file.name)
  await ipfs.files.mv(filepathsToMove, '/some/stuff')

  //  // alternatively, wrapping multiple mv calls into a single async function with await:
  //  const filesToMove = rootDirectoryContents.filter(item => item.type === 0)
  //  await Promise.all(filesToMove.map(file => {
  //    return ipfs.files.mv('/' + file.name, '/some/stuff')
  // }))

  const someStuffDirectoryContents = await all(ipfs.files.ls('/some/stuff'))
  return someStuffDirectoryContents
}

return run
`

const options = {
  overrideErrors: true
}

export default {
  validate,
  code,
  solution,
  options
}
