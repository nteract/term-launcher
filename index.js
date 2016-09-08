const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const commandExists = require('command-exists');
const platform = process.platform;

function launchTerminal(command, cwd, terminal = getDefaultTerminal(),
                        callback = noop) {

  if (!terminal) return callback(Error('Could not find the terminal.'));
  if (platform == 'darwin') {
    getDarwinCommand(command, cwd, terminal, (err, cmd) => {
      if (err) return callback(err);
      exec(cmd, callback);
    });
  } else if (platform == 'linux') {
    exec(getLinuxCommand(command, cwd, terminal), callback);
  } else if (platform == 'win32') {
    exec(getWindowsCommand(command, cwd, terminal), callback);
  } else {
    callback(Error('Only Linux, OS X and Windows are supported'));
  }
}

function getDarwinCommand(command, cwd, terminal, callback) {
  var cmd = `open -a ${terminal} `;

  if (!command) {
    if (cwd) {
      cmd = cmd + cwd;
    }
    callback(null, cmd);
  } else {
    var scriptPath = path.join(__dirname, 'cmd-script.sh');
    var script = `#!/bin/bash\n${joinCommands(cwd, command, '\n')}\n/bin/bash`;

    fs.writeFile(scriptPath, script, (err) => {
      if (err) return callback(err);
      fs.chmod(scriptPath, '755', (err) => {
        if (err) return callback(err);
        callback(null, cmd + scriptPath);
      });
    });
  }
}

function getLinuxCommand(command, cwd, terminal) {
  // http://askubuntu.com/questions/484993/run-command-on-anothernew-terminal-window
  var commands = joinCommands(cwd, command, '; ');
  if (commands) {
    return `${terminal} -e "bash -c \\"${commands}; exec bash\\""`;
  }
  return terminal;
}

function getWindowsCommand(command, cwd, terminal) {
  return `start ${terminal} /k "${joinCommands(cwd, command, ' & ')}"`;
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

function joinCommands(cwd, cmd, delimiter) {
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
  joinCommands,
  getDarwinCommand,
  getLinuxCommand,
  getWindowsCommand
};
