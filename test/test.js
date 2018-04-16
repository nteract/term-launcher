const commandExists = require('command-exists');
const expect = require('chai').expect;
const term = require('../index.js');
const path = require('path');
const fs = require('fs');

describe('_joinCommands()', () => {
  it('should not join empty commands', () => {
    expect(term._joinCommands('', '', '; ')).to.be.empty;
    expect(term._joinCommands(null, null, '; ')).to.be.empty;
    expect(term._joinCommands(undefined, undefined, '; ')).to.be.empty;
    expect(term._joinCommands(undefined, null, '; ')).to.be.empty;
  });

  it('should return the command to change the working directory', () => {
    let path = '/path/to/go';
    let joined = 'cd "/path/to/go"';
    expect(term._joinCommands(path, '', '; ')).to.equal(joined);
    expect(term._joinCommands(path, null, '; ')).to.equal(joined);
  });

  it('should return the command', () => {
    let cmd = 'foo bar';
    expect(term._joinCommands('', cmd, '; ')).to.equal(cmd);
    expect(term._joinCommands(null, cmd, '; ')).to.equal(cmd);
  });

  it('should join the commands', () => {
    let cmd = 'foo bar';
    let path = '/path/to/go';
    let joined = 'cd "/path/to/go"; foo bar';
    expect(term._joinCommands(path, cmd, '; ')).to.equal(joined);
  });
});

describe('getDefaultTerminal()', () => {
  it('should return the correct terminal for operating sytem', () => {
    let terminal = term.getDefaultTerminal();
    if (process.platform == 'darwin') {
      expect(terminal).to.equal('Terminal.app');
    } else if (process.platform == 'win32') {
      expect(terminal).to.equal('cmd');
    } else if (process.platform == 'linux') {
      let terms = [
        'gnome-terminal',
        'konsole',
        'xfce4-terminal',
        'lxterminal',
        'xterm',
        ''
      ];
      expect(terminal).to.be.oneOf(terms);
    }
  });
});

describe('getWindowsCommand()', () => {
  it('should return the correct command for windows', () => {
    let cmd = term._getWindowsCommand('foo bar', 'C:\\path\\to\\go', 'cmd.exe');
    expect(cmd).to.equal('start cmd /K "cd /d C:\\path\\to\\go & foo bar"');
  });
});

describe('getLinuxCommand()', () => {
  it('should return the correct command for linux', () => {
    let cmd = term._getLinuxCommand('foo bar', '/path/to/go', 'konsole');
    let string = `konsole -e 'bash -c "cd "/path/to/go"; foo bar; exec bash"'`
    expect(cmd).to.equal(string);
  });

  it('should return the terminal for empty path and command', () => {
    let cmd = term._getLinuxCommand('', '', 'konsole');
    expect(cmd).to.equal('konsole');
  });
});

describe('getDarwinCommand()', () => {
  it('should return the correct command for mac', (done) => {
    term._getDarwinCommand('foo bar', '/path/to/go', 'iTerm.app', (err, cmd) => {
      let scriptPath = path.join(__dirname, '..', 'cmd-script.sh');
      let stats = fs.statSync(scriptPath);
      let script = '#!/bin/bash\ncd "/path/to/go"\nfoo bar\n/bin/bash';

      expect(stats.isFile()).to.be.true;
      expect(fs.readFileSync(scriptPath, {encoding: 'utf8'})).to.equal(script);
      expect(cmd).to.equal(`open -a iTerm.app "${scriptPath}"`);
      done(err);
    });
  });

  it('should return the command to open a path', (done) => {
    term._getDarwinCommand('', '/path/to/go', 'iTerm.app', (err, cmd) => {
      expect(cmd).to.equal('open -a iTerm.app "/path/to/go"');
      done(err);
    });
  });

  it('should return the terminal for empty path and command', (done) => {
    term._getDarwinCommand('', '', 'iTerm.app', (err, cmd) => {
      expect(cmd).to.equal('open -a iTerm.app');
      done(err);
    });
  });
});

describe('launchTerminal()', () => {
  it('should callback an error if no terminal is given', (done) => {
    term.launchTerminal('', '', '', (err) => {
      expect(err).not.to.be.null;
      expect(err).to.be.an('error');
      done();
    })
  });
})

// TODO test with spies
describe('getConnectionCommand()', () => {
  it('should get the right command or error', (done) => {
    term.getConnectionCommand('connection-file', (err, cmd) => {
      commandExists('jupyter', function(e, exist) {
        if (e) throw(e);
        if(exist) {
          expect(err).to.be.null;
          expect(cmd).to.equal('jupyter console --existing connection-file');
          done();
        } else {
          commandExists('ipython', function(e, exist) {
            if (e) throw(e);
            if(exist) {
              expect(err).to.be.null;
              expect(cmd).to.equal('ipython console --existing connection-file');
              done();
            } else {
              expect(err).not.to.be.null;
              expect(err.message).to.equal('Could not find `jupyter` or `ipython`.');
              done();
            }
          });
        }
      })
    })
  })

  it('should get the right command for qtconsole or error', (done) => {
    term.getConnectionCommand('connection-file', 'qtconsole', (err, cmd) => {
      commandExists('jupyter', function(e, exist) {
        if (e) throw(e);
        if(exist) {
          expect(err).to.be.null;
          expect(cmd).to.equal('jupyter qtconsole --existing connection-file');
          done();
        } else {
          commandExists('ipython', function(e, exist) {
            if (e) throw(e);
            if(exist) {
              expect(err).to.be.null;
              expect(cmd).to.equal('ipython qtconsole --existing connection-file');
              done();
            } else {
              expect(err).not.to.be.null;
              expect(err.message).to.equal('Could not find `jupyter` or `ipython`.');
              done();
            }
          });
        }
      })
    })
  })
})

describe('getCmderCommand()', () => {
  it('should return the correct command for cmder', (done) => {
    const command = term._getCmderCommand('dir', 'C:\\Users');
    expect(command).to.equal('start cmder /START "C:\\Users" /TASK "dir"');
    done();
  });
});

describe('getPowershellCommand()', () => {
  it('should return the correct command for powershell', done => {
    const command = term._getPowershellCommand('dir', 'C:\\Users');
    expect(command).to.equal('start powershell -noexit -command "cd C:\\Users ; dir\"');
    done();
  });
});

describe('getCmdCommand()', () => {
  it('should return the correct command for cmd', done => {
    const command = term._getCmdCommand('dir', 'C:\\Users');
    expect(command).to.equal('start cmd /K "cd /d C:\\Users & dir\"');
    done();
  });
});
