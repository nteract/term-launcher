# :computer: :rocket: Term Launcher

[![Greenkeeper badge](https://badges.greenkeeper.io/nteract/term-launcher.svg)](https://greenkeeper.io/)

Launch terminals and jupyter consoles from node.

## Installation
```
npm install term-launcher
```

## Example
```javascript
const term = require('term-launcher');

term.launchTerminal('echo Hello world!');
term.launchTerminal('ls', '~/Desktop');
term.launchTerminal('ls', '~/Desktop', 'iTerm.app');

term.launchJupyter('<path-to-connection-file-of-running-kernel>');
term.launchJupyter('<path-to-connection-file>', 'Desktop', 'iTerm.app');
```

## Documentation

The full API documentation can be found [here](http://nteract.io/term-launcher/).
