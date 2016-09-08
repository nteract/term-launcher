const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const commandExists = require('command-exists');
const platform = process.platform;

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
  var cmd = `open -a ${terminal} `;

  if (!command) {
    if (cwd) {
      cmd = cmd + cwd;
    }
    callback(null, cmd);
  } else {
    var scriptPath = path.join(__dirname, 'cmd-script.sh');
    var script = `#!/bin/bash\n${_joinCommands(cwd, command, '\n')}\n/bin/bash`;

    fs.writeFile(scriptPath, script, (err) => {
      if (err) return callback(err);
      fs.chmod(scriptPath, '755', (err) => {
        if (err) return callback(err);
        callback(null, cmd + scriptPath);
      });
    });
  }
}

function _getLinuxCommand(command, cwd, terminal) {
  // http://askubuntu.com/questions/484993/run-command-on-anothernew-terminal-window
  var commands = _joinCommands(cwd, command, '; ');
  if (commands) {
    return `${terminal} -e "bash -c \\"${commands}; exec bash\\""`;
  }
  return terminal;
}

function _getWindowsCommand(command, cwd, terminal) {
  return `start ${terminal} /k "${_joinCommands(cwd, command, ' & ')}"`;
}

function launchJupyter(connectionFile, cwd, jupyterConsole = 'console',
                       terminal = getDefaultTerminal(), callback = noop) {

  var args = ` ${jupyterConsole} --existing ${connectionFile}`;
  commandExists('jupyter', function(err, exist) {
    if (err) return callback(err);
    if(exist) {
      launchTerminal('jupyter' + args, cwd, terminal, callback);
    } else {
      commandExists('ipython', function(err, exist) {
        if (err) return callback(err);
        if(exist) {
          launchTerminal('ipython' + args, cwd, terminal, callback);
        } else {
          callback(Error('Could not find `jupyter` or `ipython`.'));
        }
      });
    }
  });
}

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
    cmds.push(`cd ${cwd}`);
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
  _joinCommands,
  _getDarwinCommand,
  _getLinuxCommand,
  _getWindowsCommand
};
