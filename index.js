const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const commandExists = require('command-exists');
const platform = process.platform;

function launchTerminal(command, cwd, terminal = getDefaultTerminal(), callback = noop) {
  if (platform == 'darwin') {
    launchDarwinTerminal(command, cwd, terminal, callback);
  } else if (platform == 'linux') {
    launchLinuxTerminal(command, cwd, terminal, callback);
  } else if (platform == 'win32') {
    launchWindowsTerminal(command, cwd, terminal, callback);
  } else {
    callback(Error('Only Linux, OS X and Windows are supported'));
  }
}

function launchDarwinTerminal(command, cwd, terminal, callback = noop) {
  var cmd = `open -a ${terminal} `;

  if (command === undefined || command === null || command === '') {
    if (cwd !== undefined && cwd !== null && cwd !== '') {
      cmd = cmd + cwd;
    }
    exec(cmd, callback);
  } else {
    var scriptPath = path.join(__dirname, 'cmd-script.sh');
    var script = `#!/bin/bash\n${joinCommands(cwd, command, '\n')}\n/bin/bash`;

    fs.writeFile(scriptPath, script, (err) => {
      if (err) return callback(err);
      fs.chmod(scriptPath, '755', (err) => {
        if (err) return callback(err);
        exec(cmd + scriptPath, callback);
      });
    });
  }
}

function launchLinuxTerminal(command, cwd, terminal, callback = noop) {
  if (terminal === undefined || terminal === null || terminal === '') {
    // Check for existance of common terminals.
    // ref https://github.com/drelyn86/atom-terminus
    var terms = ['gnome-terminal', 'konsole', 'xfce4-terminal', 'lxterminal'];
    terminal = terms[0];
    for (let t of terms) {
      try {
        if (fs.statSync('/usr/bin/' + t).isFile()) {
          terminal = t;
          break;
        }
      } catch (err) {/* Don't throw error */}
    }
  }
  // http://askubuntu.com/questions/484993/run-command-on-anothernew-terminal-window
  var commands = joinCommands(cwd, command, '; ');
  var cmd;
  if (commands === '') {
    cmd = terminal;
  } else {
    cmd = `${terminal} -e "bash -c \\"${commands}; exec bash\\""`;
  }

  exec(cmd, callback);
}

function launchWindowsTerminal(command, cwd, terminal, callback = noop) {
  var cmd = `start ${terminal} /k "${joinCommands(cwd, command, ' & ')}"`;
  exec(cmd, callback);
}

function launchJupyter(connectionFile, cwd, terminal = getDefaultTerminal(),
                       callback = noop) {
  var args = ` console --existing ${connectionFile}`;
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
    return '';
  }
}

function joinCommands(cwd, cmd, delimiter) {
  var cmds = [];
  if (cwd !== undefined && cwd !== null && cwd !== '') {
    cmds.push(`cd ${cwd}`);
  }
  if (cmd !== undefined && cmd !== null && cmd !== '') {
    cmds.push(cmd);
  }
  return cmds.join(delimiter);
}

function noop() {};

module.exports = {
  launchTerminal,
  launchJupyter,
  getDefaultTerminal
};
