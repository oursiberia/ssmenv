ssmenv
======

Manage environment variables with AWS SSM.

[![Version](https://img.shields.io/npm/v/ssmenv.svg)](https://npmjs.org/package/ssmenv)
[![CircleCI](https://circleci.com/gh/oursiberia/ssmenv.svg?style=svg)](https://circleci.com/gh/oursiberia/ssmenv)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/oursiberia/ssmenv?branch=master&svg=true)](https://ci.appveyor.com/project/oursiberia/ssmenv/branch/master)
[![Codecov](https://codecov.io/gh/oursiberia/ssmenv/branch/master/graph/badge.svg)](https://codecov.io/gh/oursiberia/ssmenv)
[![Downloads/week](https://img.shields.io/npm/dw/ssmenv.svg)](https://npmjs.org/package/ssmenv)
[![License](https://img.shields.io/npm/l/ssmenv.svg)](https://github.com/oursiberia/ssmenv/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g ssmenv
$ ssmenv COMMAND
running command...
$ ssmenv (-v|--version|version)
ssmenv/0.0.0 darwin-x64 node-v9.10.1
$ ssmenv --help [COMMAND]
USAGE
  $ ssmenv COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [ssmenv hello [FILE]](#ssmenv-hello-file)
* [ssmenv help [COMMAND]](#ssmenv-help-command)

## ssmenv hello [FILE]

describe the command here

```
USAGE
  $ ssmenv hello [FILE]

OPTIONS
  -f, --force
  -n, --name=name  name to print

EXAMPLE
  $ ssmenv hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/oursiberia/ssmenv/blob/v0.0.0/src/commands/hello.ts)_

## ssmenv help [COMMAND]

display help for ssmenv

```
USAGE
  $ ssmenv help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v1.2.2/src/commands/help.ts)_
<!-- commandsstop -->
