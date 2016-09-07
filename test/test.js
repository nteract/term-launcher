const expect = require('chai').expect;
const term = require('../index.js');

describe('joinCommands', () => {
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
