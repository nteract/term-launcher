const expect = require('chai').expect;
const term = require('../index.js');
const path = require('path');
const fs = require('fs');

describe('joinCommands()', () => {
  it('should not join empty commands', () => {
    expect(term.joinCommands('', '', '; ')).to.be.empty;
    expect(term.joinCommands(null, null, '; ')).to.be.empty;
    expect(term.joinCommands(undefined, undefined, '; ')).to.be.empty;
    expect(term.joinCommands(undefined, null, '; ')).to.be.empty;
  });

  it('should return the command to change the working directory', () => {
    let path = '/path/to/go';
    let joined = 'cd /path/to/go';
    expect(term.joinCommands(path, '', '; ')).to.equal(joined);
    expect(term.joinCommands(path, null, '; ')).to.equal(joined);
  });

  it('should return the command', () => {
    let cmd = 'foo bar';
    expect(term.joinCommands('', cmd, '; ')).to.equal(cmd);
    expect(term.joinCommands(null, cmd, '; ')).to.equal(cmd);
  });

  it('should join the commands', () => {
    let cmd = 'foo bar';
    let path = '/path/to/go';
    let joined = 'cd /path/to/go; foo bar';
    expect(term.joinCommands(path, cmd, '; ')).to.equal(joined);
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
    let cmd = term.getWindowsCommand('foo bar', '/path/to/go', 'cmd.exe');
    expect(cmd).to.equal('start cmd.exe /k "cd /path/to/go & foo bar"');
  });
});

describe('getLinuxCommand()', () => {
  it('should return the correct command for linux', () => {
    let cmd = term.getLinuxCommand('foo bar', '/path/to/go', 'konsole');
    let string = 'konsole -e "bash -c \\"cd /path/to/go; foo bar; exec bash\\""'
    expect(cmd).to.equal(string);
  });

  it('should return the terminal for empty path and command', () => {
    let cmd = term.getLinuxCommand('', '', 'konsole');
    expect(cmd).to.equal('konsole');
  });
});

describe('getDarwinCommand()', () => {
  it('should return the correct command for mac', (done) => {
    term.getDarwinCommand('foo bar', '/path/to/go', 'iTerm.app', (err, cmd) => {
      let scriptPath = path.join(__dirname, '..', 'cmd-script.sh');
      let stats = fs.statSync(scriptPath);
      let script = '#!/bin/bash\ncd /path/to/go\nfoo bar\n/bin/bash';

      expect(stats.isFile()).to.be.true;
      expect(fs.readFileSync(scriptPath, {encoding: 'utf8'})).to.equal(script);
      expect(cmd).to.equal('open -a iTerm.app ' + scriptPath);
      done(err);
    });
  });

  it('should return the terminal for empty path and command', (done) => {
    term.getDarwinCommand('', '', 'iTerm.app', (err, cmd) => {
      expect(cmd).to.equal('open -a iTerm.app ');
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
