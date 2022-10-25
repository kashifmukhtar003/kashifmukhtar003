const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const spawn = require('child_process').spawn;
const authHandler = require('../controllers/auth/index');
const osHandler = require('../controllers/os/index');
var crypto = require('crypto');
const { config, LOG } = require('../../brain/common');
const logsHandler = require('../controllers/logs/index');

/**
 * Get a list of the processes that have been started by this app
 */
//not used
function getProcesses() {
  //why we need this function. 
  return []; //config.get('processes') || [];
}

/**
 * Log that a process has been started
 * @param {object} process - Object describing the process
 */
//not used
function addProcess(process, callback) {
  if (!process.startTime) {
    process.startTime = Date.now();
  }
  process.id = crypto.randomBytes(16).toString('hex'); // Add a unique id to the process for later reference when deleting it.
  //not pushing the processes 
  var processes = []; //config.get('processes') || [];
  processes.push(process);
}

/**
 * Remove a process from the process list
 * @param {*} id - the id of the process to remove (16-hex)
 * @param {*} callback
 */
//not used
function removeProcess(id, callback) {
  //why
  const processes = []; //config.get('processes') || [];

  const processesToRemove = processes.filter((process) => process.id === id);

  if (processesToRemove.length < 1) {
    callback(`process with id ${id} not found`);
  } else {
    const newProcesslist = processes.filter((process) => process.id !== id);
  }
}

/**
 * Find an executable in a folder
 * @param {*} folderPath - path to the folder to look for executable in
 */
function getExecutablePathFromFolder(folderPath, callback) {
  let executablePath;
  fs.readdir(folderPath, (err, dirlist) => {
    if (err) {
      var errMsg = `Error reading executable dir.\nError: ${err}`;
      callback(new Error(errMsg));
    } else {
      switch (process.platform) {
        case 'darwin':
          folderPath = path.resolve(
            folderPath,
            dirlist.filter((dir) => dir.indexOf('.app') !== -1)[0]
          );
          executablePath = path.resolve(folderPath, 'Contents', 'MacOS');

          fs.readdir(executablePath, (err, dirlist) => {
            if (err) {
              return callback(err);
            } else if (dirlist.length !== 1) {
              return callback(
                new Error(
                  `Expected exactly one file in the folder ${executablePath}`
                )
              );
            } else {
              // Assume that theres only one executable file in the directory
              callback(null, path.resolve(executablePath, dirlist[0]));
            }
          });

        case 'linux':
          fs.readdir(folderPath, (err, dirlist) => {
            if (err) {
              logsHandler.log(err, LOG.SEVERITY.ERROR, [LOG.TARGET.CLOUD, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
              return callback(err);
            } else {
              for (var i in dirlist) {
                // Assume that the file with extension .x86_64 is the executable for launching the executable
                if (path.extname(dirlist[i]) === '.x86_64') {
                  executablePath = path.resolve(folderPath, dirlist[i]);
                  break;
                }
              }
              if (executablePath) {
                return callback(null, executablePath);
              } else {
                return callback(
                  new Error(`No executable found in the folder (${folderPath})`)
                );
              }
            }
          });
          break;

        default:
          const error = `Unsupported platform: ${process.platform}.`;
          callback(error);
          executablePath = null;
          break;
      }
    }
  });
}

const spawnChild = async(executable, callback)=> {
  
  let executableEnv = executable.env || {};
  executableEnv = Object.assign({}, executableEnv, process.env);
  
  //Fetching AccessToken
  const mac = await osHandler('osConfig', { action: 'systemMac' });
  const auth = await authHandler('auth', { action: 'getToken', params: { mac: mac } });

  //ENVIRONMENT VARIABLES FOR CHILD PROCESS
  // Add environment variables that should be passed to the executable
  const env = Object.assign({}, executableEnv, {
    CINEMATAZTIC_ACCESS_TOKEN: auth?.access_token,
    ASSET_DIR: path.resolve(os.homedir(), 'Assets/assets'),
    //HARD CODED
    SEAT_LAYOUT: '2',
    NETWORK_NAME: executable.options.screen.networkName,
    COUNTRY_CODE: executable.options.screen.countryCode,
    CLUSTER_NAME: executable.options.screen.clusterName,
    //HARD CODED
    // CINEAD_API_URL: '',
  });

  var child = spawn(
    executable.executablePath,
    ['--single-instance'], // doesn't seem to have an effect on Ubuntu Server 1604
    {
      env,
      killSignal: 'SIGTERM',
      stdio: ['ignore', 'ignore', 'ignore'],
    }
  );

  if (child) {
    addProcess(
      {
        title: executable.title,
        pid: child.pid,
        timeout: executable.timeout * 1000 || 600 * 1000,
      },
      function (err) {
        if (err) {
          logsHandler.log(err, LOG.SEVERITY.ERROR, [LOG.TARGET.CLOUD, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
        }
      }
    );

    const killerTimer = setTimeout(() => {
      child.kill();
    }, executable.timeout * 1000 || 600000 + 30000);

    child.on('close', function () {
      clearTimeout(killerTimer);
    });

    child.on('exit', (code, signal) =>
      logsHandler.log(`Child process exited Code: ${code}, Signal: ${signal}`)
    );
    child.unref();
    child.on('error', (error) => logsHandler.log(`Error in child process ${error}`, LOG.SEVERITY.ERROR, [LOG.TARGET.CLOUD, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL));

    callback(null, child);
  } else {
    return {
      err: 'Unable to spawn child process.',
    };
  }
}

function pruneProcesses() {
  const processes = getProcesses();
  const errors = [];

  const processesToPrune = Object.assign([], processes)
    .filter((process) => Date.now() - process.timeout - process.startTime > 0) // Get the processs that have been running longer than they should
    .map((process) => {
      removeProcess(process.id, (err, id) => {
        if (err) {
          errors.push(err);
        }
      });
    });

  if (errors.length) {
    return {
      err: `Error pruning processes: ${JSON.stringify(errors)}`,
    };
  } else {
    return {
      processesToPrune: processesToPrune.length,
      processes: processes.length,
    };
  }
}

/**
 * Spawn a executable as a child process.
 * @param {object} executable
 * @param {*} callback
 */
function spawnProcess(executable, ignoreCooldown, callback) {
  const pruned = pruneProcesses();
  logsHandler.log(`pruned ${pruned}`)
  if (pruned.err) {
    return {
      err: err,
      child: null,
    };
  } else {

    let gamePath = executable.path;
    //no use 
    if (!ignoreCooldown && getProcesses() && getProcesses().length > 0) {
      return {
        err: 'AlreadyRunningError',
        child: null,
      };
    } else {
      // Check if it's a file or symlink
      //if (
      //    fs.lstatSync(gamePath).isSymbolicLink() ||
      //    fs.lstatSync(gamePath).isFile()
      //) {
      executable.executablePath = gamePath;
      spawnChild(executable, callback);

      // Handle if it's a directory - we can't execute directories directly :)
      if (fs.lstatSync(gamePath).isDirectory()) {
        getExecutablePathFromFolder(gamePath, (err, executablePath) => {
          if (err) {
            logsHandler.log(`🚀 ~ file: index.js ~ line 209 ~ getExecutablePathFromFolder ~ err${err}`, LOG.SEVERITY.ERROR, [LOG.TARGET.CLOUD, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
            callback(err);
          } else {
            logsHandler.log(`🚀 ~ file: index.js ~ line 208 ~ getExecutablePathFromFolder ~ executablePath ${executablePath}`);
            executable.executablePath = executablePath;
            spawnChild(executable, callback);
          }
        });
      }
    }
  }
}

const spawn_options = {
  cwd: null,
  env: null,
  detached: false,
  // stdio: 'inherit',
  shell: true,
};

const execScript = async (filename, args, callback) => {
  const execute = spawn(config.scriptsPath + filename, args, spawn_options);

  execute.stdout.on('data', (data) => {
    logsHandler.log(`stdout: ${data}`);
    callback(null, data);
  });

  execute.stderr.on('data', (data) => {
    logsHandler.log(`stderr: ${data}`);
    callback(new Error(`Execution failed ${data}`));
  });

  execute.on('close', (code) => {
    logsHandler.log(`child process exited with code ${code}`);
    callback(null, code);
  });
};

module.exports = {
  spawnProcess,
  execScript,
  test: {
    spawnProcess,
    getProcesses,
    addProcess,
    removeProcess,
    pruneProcesses,
  },
};
