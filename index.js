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
  if (command === undefined || command === null || command === '') {
    exec(`open -a ${terminal} ${cwd}`, (err) => { callback(err); });
  } else {
    var scriptPath = path.join(__dirname, 'cmd-script.sh');
    var script;
    if (cwd === undefined || cwd === null || cwd === '') {
      script = `#!/bin/bash\n${command}`;
    } else {
      script = `#!/bin/bash\ncd ${cwd}\n${command}`;
    }

    fs.writeFile(scriptPath, script, (err) => {
      if (err) callback(err);
      fs.chmod(scriptPath, '755', (err) => {
        if (err) callback(err);
        exec(`open -a ${terminal} ${scriptPath}`, (err) => { callback(err); });
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

  var cmd;
  if (cwd === undefined || cwd === null || cwd === '') {
    cmd = `${terminal} -e ${command}`;
  } else {
    cmd = `${terminal} -e cd ${cwd}; ${command};`;
  }

  exec(cmd, (err) => { callback(err); });
}

function launchWindowsTerminal(command, cwd, terminal, callback = noop) {
  var cmd;
  if (cwd === undefined || cwd === null || cwd === '') {
    cmd = `start ${terminal} /k ${command}`;
  } else {
    cmd = `start ${terminal} /k cd ${cwd}; ${command};`;
  }

  exec(cmd, (err) => { callback(err); });
}

function launchJupyter(connectionFile, cwd, terminal = getDefaultTerminal(),
                       callback = noop) {
  var args = ` console --existing ${connectionFile}`;
  commandExists('jupyter', function(err, exist) {
    if (err) callback(err);
    if(exist) {
      launchTerminal('jupyter' + args, cwd, terminal, callback);
    } else {
      commandExists('ipython', function(err, exist) {
        if (err) callback(err);
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

function noop() {};

module.exports = {
  launchTerminal,
  launchJupyter,
  getDefaultTerminal
};
