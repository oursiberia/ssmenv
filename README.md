# ssmenv

Manage environment variables with AWS SSM.

[![Version](https://img.shields.io/npm/v/ssmenv.svg)](https://npmjs.org/package/ssmenv)
[![CircleCI](https://circleci.com/gh/oursiberia/ssmenv.svg?style=svg)](https://circleci.com/gh/oursiberia/ssmenv)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/oursiberia/ssmenv?branch=master&svg=true)](https://ci.appveyor.com/project/oursiberia/ssmenv/branch/master)
[![Codecov](https://codecov.io/gh/oursiberia/ssmenv/branch/master/graph/badge.svg)](https://codecov.io/gh/oursiberia/ssmenv)
[![Downloads/week](https://img.shields.io/npm/dw/ssmenv.svg)](https://npmjs.org/package/ssmenv)
[![License](https://img.shields.io/npm/l/ssmenv.svg)](https://github.com/oursiberia/ssmenv/blob/master/package.json)

* [Usage](#usage)
* [Commands](#commands)

# Usage

<!-- usage -->
```sh-session
$ npm install -g ssmenv
$ ssmenv COMMAND
running command...
$ ssmenv (-v|--version|version)
ssmenv/0.1.0 darwin-x64 node-v9.10.1
$ ssmenv --help [COMMAND]
USAGE
  $ ssmenv COMMAND
...
```
<!-- usagestop -->

After install run `ssmenv init` to generate configuration files for the
project.  The configuration files are places in the `.ssmenv` directory as
`public.json` and `private.json`. `public.json` will only contain data that is
not sensitive, it should be added to source control. `private.json` will
contain sensitive data (such as AWS access key credentials) and should be
ignored by source control.

# Commands

In the following command examples lines beginning with `? ` indicate prompts
for input.

<!-- commands -->
* [ssmenv env STAGE](#ssmenv-env-stage)
* [ssmenv env:dotenv STAGE](#ssmenv-envdotenv-stage)
* [ssmenv help [COMMAND]](#ssmenv-help-command)
* [ssmenv init [ROOTPATH] [AWSACCESS] [AWSSECRET]](#ssmenv-init-rootpath-awsaccess-awssecret)
* [ssmenv var STAGE KEY VALUE](#ssmenv-var-stage-key-value)
* [ssmenv var:set STAGE KEY VALUE](#ssmenv-varset-stage-key-value)

## ssmenv env STAGE

Generate .env compatible output from stored parameters.

```
USAGE
  $ ssmenv env STAGE

ARGUMENTS
  STAGE  Stage to use for retrieving data. Appended to root path.

OPTIONS
  --withDecryption  Attempt to decrypt parameters using accessible KMS keys.

EXAMPLES
  # Write test stage to STDOUT; assumes "FOO" and "foo" are set as vars.
  $ ssmenv env:dotenv test
  FOO=bar
  foo=baz

  # Write test stage to .env.test
  $ ssmenv env:dotenv test > .env.test
```

_See code: [src/commands/env.ts](https://github.com/oursiberia/ssmenv/blob/v0.1.0/src/commands/env.ts)_

### ssmenv env:dotenv STAGE

Generate .env compatible output from stored parameters.

```
USAGE
  $ ssmenv env:dotenv STAGE

ARGUMENTS
  STAGE  Stage to use for retrieving data. Appended to root path.

OPTIONS
  --withDecryption  Attempt to decrypt parameters using accessible KMS keys.

EXAMPLES
  # Write test stage to STDOUT; assumes "FOO" and "foo" are set as vars.
  $ ssmenv env:dotenv test
  FOO=bar
  foo=baz

  # Write test stage to .env.test
  $ ssmenv env:dotenv test > .env.test
```

_See code: [src/commands/env/dotenv.ts](https://github.com/oursiberia/ssmenv/blob/v0.1.0/src/commands/env/dotenv.ts)_

## ssmenv env:dotenv STAGE

Generate .env compatible output from stored parameters.

```
USAGE
  $ ssmenv env:dotenv STAGE

ARGUMENTS
  STAGE  Stage to use for retrieving data. Appended to root path.

OPTIONS
  --withDecryption  Attempt to decrypt parameters using accessible KMS keys.

EXAMPLES
  # Write test stage to STDOUT; assumes "FOO" and "foo" are set as vars.
  $ ssmenv env:dotenv test
  FOO=bar
  foo=baz

  # Write test stage to .env.test
  $ ssmenv env:dotenv test > .env.test
```

_See code: [src/commands/env/dotenv.ts](https://github.com/oursiberia/ssmenv/blob/v0.1.0/src/commands/env/dotenv.ts)_

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

## ssmenv init [ROOTPATH] [AWSACCESS] [AWSSECRET]

Create a configuration files for your project.

```
USAGE
  $ ssmenv init [ROOTPATH] [AWSACCESS] [AWSSECRET]

ARGUMENTS
  ROOTPATH   Root path for the project.
  AWSACCESS  AWS Access Key Id to use when interacting with AWS API.
  AWSSECRET  AWS Secret Key to use when interacting with AWS API.

EXAMPLES
  # Create configuration with given parameters.
  $ ssmenv init / FOO bar
  Configuration written to .ssmenv/public.json and .ssmenv/private.json.
  * Recommend adding .ssmenv/public.json to source control.
  * Recommend ignoring .ssmenv/private.json in source control.

  # Create configuration by using prompts.
  # The value inside parentheses will be used as the default.
  $ ssmenv init
  ? AWS Access Key ID
  ? AWS Secret Access Key
  ? Root Path (/)
  Configuration written to .ssmenv/public.json and .ssmenv/private.json.
  * Recommend adding .ssmenv/public.json to source control.
  * Recommend ignoring .ssmenv/private.json in source control.
```

_See code: [src/commands/init.ts](https://github.com/oursiberia/ssmenv/blob/v0.1.0/src/commands/init.ts)_

## ssmenv var STAGE KEY VALUE

Set the value of a variable. Creates it if it does not exist, creates a new version if it does.

```
USAGE
  $ ssmenv var STAGE KEY VALUE

ARGUMENTS
  STAGE  Stage to use for retrieving data. Appended to root path.
  KEY    Key to use when setting the variable; AKA variable name.
  VALUE  Value of the variable to set.

OPTIONS
  -d, --description=description     Description of the variable.
  -k, --withEncryption=KMS Key ARN  Attempt to encrypt parameter using KMS key name.
  -t, --tag=TagName:TagValue        Tags to set on the variable as TagName:TagValue.

EXAMPLES
  # Set value of FOO variable in test stage.
  $ ssmenv var:set test FOO bar
  {
     "key": "FOO",
     "path": "/test/FOO",
     "value": "bar",
     "version": 1
  }

  # Set value of FOO variable for staging with a description.
  $ ssmenv var:set staging FOO "bar baz" --description="A description of FOO"
  {
     "key": "FOO",
     "path": "/staging/FOO",
     "description": "A description of FOO"
     "value": "bar baz",
     "version": 1
  }
```

_See code: [src/commands/var.ts](https://github.com/oursiberia/ssmenv/blob/v0.1.0/src/commands/var.ts)_

### ssmenv var:set STAGE KEY VALUE

Set the value of a variable. Creates it if it does not exist, creates a new version if it does.

```
USAGE
  $ ssmenv var:set STAGE KEY VALUE

ARGUMENTS
  STAGE  Stage to use for retrieving data. Appended to root path.
  KEY    Key to use when setting the variable; AKA variable name.
  VALUE  Value of the variable to set.

OPTIONS
  -d, --description=description     Description of the variable.
  -k, --withEncryption=KMS Key ARN  Attempt to encrypt parameter using KMS key name.
  -t, --tag=TagName:TagValue        Tags to set on the variable as TagName:TagValue.

EXAMPLES
  # Set value of FOO variable in test stage.
  $ ssmenv var:set test FOO bar
  {
     "key": "FOO",
     "path": "/test/FOO",
     "value": "bar",
     "version": 1
  }

  # Set value of FOO variable for staging with a description.
  $ ssmenv var:set staging FOO "bar baz" --description="A description of FOO"
  {
     "key": "FOO",
     "path": "/staging/FOO",
     "description": "A description of FOO"
     "value": "bar baz",
     "version": 1
  }
```

_See code: [src/commands/var/set.ts](https://github.com/oursiberia/ssmenv/blob/v0.1.0/src/commands/var/set.ts)_

## ssmenv var:set STAGE KEY VALUE

Set the value of a variable. Creates it if it does not exist, creates a new version if it does.

```
USAGE
  $ ssmenv var:set STAGE KEY VALUE

ARGUMENTS
  STAGE  Stage to use for retrieving data. Appended to root path.
  KEY    Key to use when setting the variable; AKA variable name.
  VALUE  Value of the variable to set.

OPTIONS
  -d, --description=description     Description of the variable.
  -k, --withEncryption=KMS Key ARN  Attempt to encrypt parameter using KMS key name.
  -t, --tag=TagName:TagValue        Tags to set on the variable as TagName:TagValue.

EXAMPLES
  # Set value of FOO variable in test stage.
  $ ssmenv var:set test FOO bar
  {
     "key": "FOO",
     "path": "/test/FOO",
     "value": "bar",
     "version": 1
  }

  # Set value of FOO variable for staging with a description.
  $ ssmenv var:set staging FOO "bar baz" --description="A description of FOO"
  {
     "key": "FOO",
     "path": "/staging/FOO",
     "description": "A description of FOO"
     "value": "bar baz",
     "version": 1
  }
```

_See code: [src/commands/var/set.ts](https://github.com/oursiberia/ssmenv/blob/v0.1.0/src/commands/var/set.ts)_
<!-- commandsstop -->
