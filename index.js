const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const commandExists = require('command-exists');
const platform = process.platform;

/**
 * Launches a Terminal at the given directory and executes a command.
 * @param {string} [command]    The command to execute in the terminal.
 * @param {string} [cwd]        The current working directory where the terminal
 *                              will be launched.
 * @param {string} [terminal=getDefaultTerminal()]
 *                              The terminal to launch. This will depend on your
 *                              operating system.
 * @param {Callback} [callback] Calls back errors.
 */
function launchTerminal(command, cwd, terminal = getDefaultTerminal(),
                        callback = noop) {

  if (!terminal) return callback(Error('Could not find the terminal.'));
  if (platform == 'darwin') {
    _getDarwinCommand(command, cwd, terminal, (err, cmd) => {
      if (err) return callback(err);
      exec(cmd, callback);
    });
  } else if (platform == 'linux') {
    exec(_getLinuxCommand(command, cwd, terminal), callback);
  } else if (platform == 'win32') {
    exec(_getWindowsCommand(command, cwd, terminal), callback);
  } else {
    callback(Error('Only Linux, OS X and Windows are supported'));
  }
}

function _getDarwinCommand(command, cwd, terminal, callback) {
  var cmd = `open -a ${terminal}`;

  if (!command) {
    if (cwd) {
      cmd = `${cmd} "${cwd}"`;
    }
    callback(null, cmd);
  } else {
    var scriptPath = path.join(__dirname, 'cmd-script.sh');
    var script = `#!/bin/bash\n${_joinCommands(cwd, command, '\n')}\n/bin/bash`;

    fs.writeFile(scriptPath, script, (err) => {
      if (err) return callback(err);
      fs.chmod(scriptPath, '755', (err) => {
        if (err) return callback(err);
        callback(null, `${cmd} "${scriptPath}"`);
      });
    });
  }
}

function _getLinuxCommand(command, cwd, terminal) {
  // http://askubuntu.com/questions/484993/run-command-on-anothernew-terminal-window
  var commands = _joinCommands(cwd, command, '; ');
  if (commands) {
    return `${terminal} -e 'bash -c "${commands}; exec bash"'`;
  }
  return terminal;
}

function _getWindowsCommand(command, cwd, terminal) {
  var term = terminal.toLowerCase().trim().replace(/\.exe$/g, '');

  switch (term) {
    case 'cmder':
      return _getCmderCommand(command, cwd);
    case 'powershell':
      return _getPowershellCommand(command, cwd);
    case 'cmd':
    default:
      return _getCmdCommand(command, cwd);
  }
}

function _getCmdCommand(command, cwd) {
  var commandSegment = '';
  if (command) {
    if (cwd) {
      commandSegment = ('"cd /d ' + cwd + ' & ' + command + '"');
    } else {
      commandSegment = command;
    }
  }
  return `start cmd /K ${commandSegment}`;
}

function _getPowershellCommand(command, cwd) {
  var commandSegment = '';
  if (command) {
    if (cwd) {
      commandSegment = ('"cd ' + cwd + ' ; ' +
        command.replace(/"/g, '\\"') + '"');
    } else {
      commandSegment = command.replace(/"/g, '\\"');
    }
  }
  return `start powershell -noexit -command ${commandSegment}`;
}

function _getCmderCommand(command, cwd) {
  var cwdSegment = '';
  if (cwd) {
    cwd = cwd.replace(/"/g, '\\"');
    cwdSegment = '/START "' + cwd + '"';
  }

  var commandSegment = '';
  if (command) {
    commandSegment = '/TASK "' + command.replace(/"/g, '\\"') + '"';
  }

  return `start cmder ${cwdSegment} ${commandSegment}`;
}

/**
 * Launches a jupyter or ipython console and connects to the kernel defined in
 * the connection file. It starts the console by execution
 * <code>jupyter jupyterConsole --existing connectionFile</code>.
 * @param {string} connectionFile The path to the connection file of the kernel
 *                                to connect to.
 * @param {string} [cwd]          The current working directory where the
 *                                terminal will be launched.
 * @param {string} [jupyterConsole=console]
 *                                The jupyter console to start (eg qtconsole).
 * @param {string} [terminal=getDefaultTerminal()]
 *                                The terminal to launch. This will depend on
 *                                your operating system.
 * @param {Callback} [callback]   Calls back errors.
 */
function launchJupyter(connectionFile, cwd, jupyterConsole = 'console',
                       terminal = getDefaultTerminal(), callback = noop) {

  getConnectionCommand(connectionFile, jupyterConsole, function(err, command) {
    if (err) return callback(err);
    launchTerminal(command, cwd, terminal, callback);
  })
}

/**
 * Returns the command to connect to the kernel defined in the connection file.
 * E.g. <code>jupyter console --existing connectionFile</code>.
 * @param {string} connectionFile The path to the connection file of the kernel
 *                                to connect to.
 * @param {string} [jupyterConsole=console]
 *                                The jupyter console to start (e.g. console or qtconsole).
 * @param {Callback} [callback]   Calls back any errors and the connection command (err, command).
 */
function getConnectionCommand(connectionFile, jupyterConsole, callback) {
  if (!callback && typeof jupyterConsole === 'function') {
    callback = jupyterConsole;
    jupyterConsole = 'console';
  }
  var args = ` ${jupyterConsole} --existing ${connectionFile}`;
  commandExists('jupyter', function(err, exist) {
    if (err) return callback(err);
    if(exist) {
      callback(null, 'jupyter' + args);
    } else {
      commandExists('ipython', function(err, exist) {
        if (err) return callback(err);
        if(exist) {
          callback(null, 'ipython' + args);
        } else {
          callback(Error('Could not find `jupyter` or `ipython`.'));
        }
      });
    }
  });
}

/**
 * Returns the default terminal for your operation system: <br>
 * macOS: Terminal.app <br>
 * Windows: cmd <br>
 * Linux: Checks for the existance of gnome-terminal, konsole, xfce4-terminal,
 *        lxterminal or xterm.
 * @return {string} terminal
 */
function getDefaultTerminal() {
  if (platform == 'darwin') {
    return 'Terminal.app';
  } else if (platform == 'win32') {
    return 'cmd';
  } else {
    // Check for existance of common terminals.
    // ref https://github.com/drelyn86/atom-terminus
    var terminal = '';
    var terms = [
      'gnome-terminal',
      'konsole',
      'xfce4-terminal',
      'lxterminal',
      'xterm'
    ];
    for (let t of terms) {
      try {
        if (fs.statSync('/usr/bin/' + t).isFile()) {
          terminal = t;
          break;
        }
      } catch (err) {/* Don't throw error */}
    }
    return terminal;
  }
}

function _joinCommands(cwd, cmd, delimiter) {
  var cmds = [];
  if (cwd) {
    cmds.push(`cd "${cwd}"`);
  }
  if (cmd) {
    cmds.push(cmd);
  }
  return cmds.join(delimiter);
}

function noop() {};

module.exports = {
  launchTerminal,
  launchJupyter,
  getDefaultTerminal,
  getConnectionCommand,
  _joinCommands,
  _getDarwinCommand,
  _getLinuxCommand,
  _getWindowsCommand,
  _getCmderCommand,
  _getPowershellCommand,
  _getCmdCommand,
};
