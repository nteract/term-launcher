# term-launcher

Launch terminals and jupyter consoles from node.

This isn't tested on Linux and Windows if you can please report if it works.

## Usage
```javascript
const term = require('term-launcher');

term.launchTerminal('echo Hello world!');
term.launchTerminal('ls', 'Desktop');
term.launchTerminal('ls', 'Desktop', 'iTerm.app');

term.launchJupyter('<path-to-connection-file-of-running-kernel>');
term.launchJupyter('<path-to-connection-file>', 'Desktop', 'iTerm.app');
```
