# ssmenv-cli

[![Version](https://img.shields.io/npm/v/ssmenv-cli.svg)](https://npmjs.org/package/ssmenv-cli)
[![CircleCI](https://circleci.com/gh/oursiberia/ssmenv.svg?style=svg)](https://circleci.com/gh/oursiberia/ssmenv)
[![Downloads/week](https://img.shields.io/npm/dw/ssmenv-cli.svg)](https://npmjs.org/package/ssmenv-cli)
[![License](https://img.shields.io/npm/l/ssmenv-cli.svg)](https://github.com/oursiberia/ssmenv/blob/master/packages/ssmenv-cli/package.json)

Manage environment variables with AWS SSM from the command line.

* [Usage](#usage)
* [Commands](#commands)

# Usage

<!-- usage -->
```sh-session
$ npm install -g ssmenv-cli
$ ssmenv COMMAND
running command...
$ ssmenv (-v|--version|version)
ssmenv-cli/0.5.0 darwin-x64 node-v9.11.1
$ ssmenv --help [COMMAND]
USAGE
  $ ssmenv COMMAND
...
```
<!-- usagestop -->

After install run `ssmenv init` to generate configuration files for the
project. The `init` command asks for AWS Access and Secret Keys, the intention
is these are keys for an IAM user's account, these will identify which account
makes changes to variables in the SSM Parameter Store. The configuration files
are placed in the `.ssmenv` directory as `public.json` and `private.json`.
`public.json` will only contain data that is not sensitive (such as project
root path), it should be added to source control. `private.json` will contain
sensitive data (such as AWS access key credentials) and should be ignored by
source control.

# Commands

In the following command examples lines beginning with `? ` indicate prompts
for input.

<!-- commands -->
* [ssmenv env STAGE](#ssmenv-env-stage)
* [ssmenv env:dotenv STAGE](#ssmenv-envdotenv-stage)
* [ssmenv env:list](#ssmenv-envlist)
* [ssmenv help [COMMAND]](#ssmenv-help-command)
* [ssmenv init [ROOTPATH] [AWSACCESS] [AWSSECRET]](#ssmenv-init-rootpath-awsaccess-awssecret)
* [ssmenv var KEY VALUE](#ssmenv-var-key-value)
* [ssmenv var:del KEY](#ssmenv-vardel-key)
* [ssmenv var:set KEY VALUE](#ssmenv-varset-key-value)
* [ssmenv var:tag KEY](#ssmenv-vartag-key)

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

_See code: [src/commands/env.ts](https://github.com/oursiberia/ssmenv/blob/v0.5.0/src/commands/env.ts)_

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

_See code: [src/commands/env/dotenv.ts](https://github.com/oursiberia/ssmenv/blob/v0.5.0/src/commands/env/dotenv.ts)_

### ssmenv env:list

List the known stages or environments, ignoring configured `rootPath`.

```
USAGE
  $ ssmenv env:list

DESCRIPTION
  A stage or environment is considered any path with a direct child path holding a value.

EXAMPLE
  # List out the full paths to all known stages.
  $ ssmenv env:list
  /client/project/dev
  /client/project/production
  /client/project/test
  /otherclient/test_project/production
  /otherproject/dev
```

_See code: [src/commands/env/list.ts](https://github.com/oursiberia/ssmenv/blob/v0.5.0/src/commands/env/list.ts)_

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

_See code: [src/commands/env/dotenv.ts](https://github.com/oursiberia/ssmenv/blob/v0.5.0/src/commands/env/dotenv.ts)_

## ssmenv env:list

List the known stages or environments, ignoring configured `rootPath`.

```
USAGE
  $ ssmenv env:list

DESCRIPTION
  A stage or environment is considered any path with a direct child path holding a value.

EXAMPLE
  # List out the full paths to all known stages.
  $ ssmenv env:list
  /client/project/dev
  /client/project/production
  /client/project/test
  /otherclient/test_project/production
  /otherproject/dev
```

_See code: [src/commands/env/list.ts](https://github.com/oursiberia/ssmenv/blob/v0.5.0/src/commands/env/list.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v1.2.4/src/commands/help.ts)_

## ssmenv init [ROOTPATH] [AWSACCESS] [AWSSECRET]

Create the configuration files for your project.

```
USAGE
  $ ssmenv init [ROOTPATH] [AWSACCESS] [AWSSECRET]

ARGUMENTS
  ROOTPATH   Root path for the project.
  AWSACCESS  AWS Access Key Id to use when interacting with AWS API.
  AWSSECRET  AWS Secret Key to use when interacting with AWS API.

OPTIONS
  -q, --quiet        Suppress informative but unnecessary output.
  -s, --stage=stage  Stage to operate within. May be provided multiple times.

EXAMPLES
  # Create configuration with given parameters.
  $ ssmenv init --stage=production / FOO bar
  Configuration written to .ssmenv/public.json and .ssmenv/private.json.
  * Recommend adding .ssmenv/public.json to source control.
  * Recommend ignoring .ssmenv/private.json in source control.

  # Create configuration by using prompts.
  # The value inside parentheses will be used as the default.
  $ ssmenv init
  ? AWS Access Key ID
  ? AWS Secret Access Key
  ? Root Path (/)
  ? Comma Separated Stages (development,production,staging,test)
  Configuration written to .ssmenv/public.json and .ssmenv/private.json.
  * Recommend adding .ssmenv/public.json to source control.
  * Recommend ignoring .ssmenv/private.json in source control.
```

_See code: [src/commands/init.ts](https://github.com/oursiberia/ssmenv/blob/v0.5.0/src/commands/init.ts)_

## ssmenv var KEY VALUE

Set the value of a variable. Creates it if it does not exist, creates a new version if it does.

```
USAGE
  $ ssmenv var KEY VALUE

ARGUMENTS
  KEY    Key to use when setting the variable; AKA variable name.
  VALUE  Value of the variable to set.

OPTIONS
  -d, --description=description  Description of the variable.
  -s, --stage=stage              Stage to operate within. May be provided multiple times.

EXAMPLES
  # Set value of FOO variable in test stage.
  $ ssmenv var:set --stage=test FOO bar

  # Set value of FOO variable for staging with a description.
  $ ssmenv var:set --stage=staging FOO "bar baz" --description="A description of FOO"
```

_See code: [src/commands/var.ts](https://github.com/oursiberia/ssmenv/blob/v0.5.0/src/commands/var.ts)_

### ssmenv var:del KEY

Delete a variable.

```
USAGE
  $ ssmenv var:del KEY

ARGUMENTS
  KEY  Key to use when setting the variable; AKA variable name.

OPTIONS
  -s, --stage=stage  Stage to operate within. May be provided multiple times.

EXAMPLE
  # Delete variable FOO in test stage.
  $ ssmenv var:del --stage=test FOO
```

_See code: [src/commands/var/del.ts](https://github.com/oursiberia/ssmenv/blob/v0.5.0/src/commands/var/del.ts)_

### ssmenv var:set KEY VALUE

Set the value of a variable. Creates it if it does not exist, creates a new version if it does.

```
USAGE
  $ ssmenv var:set KEY VALUE

ARGUMENTS
  KEY    Key to use when setting the variable; AKA variable name.
  VALUE  Value of the variable to set.

OPTIONS
  -d, --description=description  Description of the variable.
  -s, --stage=stage              Stage to operate within. May be provided multiple times.

EXAMPLES
  # Set value of FOO variable in test stage.
  $ ssmenv var:set --stage=test FOO bar

  # Set value of FOO variable for staging with a description.
  $ ssmenv var:set --stage=staging FOO "bar baz" --description="A description of FOO"
```

_See code: [src/commands/var/set.ts](https://github.com/oursiberia/ssmenv/blob/v0.5.0/src/commands/var/set.ts)_

### ssmenv var:tag KEY

Add tags to a variable. Variable must exist.

```
USAGE
  $ ssmenv var:tag KEY

ARGUMENTS
  KEY  Key to use when setting the variable; AKA variable name.

OPTIONS
  -s, --stage=stage           Stage to operate within. May be provided multiple times.
  -t, --tag=TagName:TagValue  Tags to set on the variable as TagName:TagValue.

EXAMPLES
  # Set Client tag of FOO variable in test stage.
  $ ssmenv var:set test FOO --tag=Client:baz

  # Set multiple tags on FOO variable for staging.
  $ ssmenv var:set staging FOO --tag=Client:baz --tag=Environment:staging
```

_See code: [src/commands/var/tag.ts](https://github.com/oursiberia/ssmenv/blob/v0.5.0/src/commands/var/tag.ts)_

## ssmenv var:del KEY

Delete a variable.

```
USAGE
  $ ssmenv var:del KEY

ARGUMENTS
  KEY  Key to use when setting the variable; AKA variable name.

OPTIONS
  -s, --stage=stage  Stage to operate within. May be provided multiple times.

EXAMPLE
  # Delete variable FOO in test stage.
  $ ssmenv var:del --stage=test FOO
```

_See code: [src/commands/var/del.ts](https://github.com/oursiberia/ssmenv/blob/v0.5.0/src/commands/var/del.ts)_

## ssmenv var:set KEY VALUE

Set the value of a variable. Creates it if it does not exist, creates a new version if it does.

```
USAGE
  $ ssmenv var:set KEY VALUE

ARGUMENTS
  KEY    Key to use when setting the variable; AKA variable name.
  VALUE  Value of the variable to set.

OPTIONS
  -d, --description=description  Description of the variable.
  -s, --stage=stage              Stage to operate within. May be provided multiple times.

EXAMPLES
  # Set value of FOO variable in test stage.
  $ ssmenv var:set --stage=test FOO bar

  # Set value of FOO variable for staging with a description.
  $ ssmenv var:set --stage=staging FOO "bar baz" --description="A description of FOO"
```

_See code: [src/commands/var/set.ts](https://github.com/oursiberia/ssmenv/blob/v0.5.0/src/commands/var/set.ts)_

## ssmenv var:tag KEY

Add tags to a variable. Variable must exist.

```
USAGE
  $ ssmenv var:tag KEY

ARGUMENTS
  KEY  Key to use when setting the variable; AKA variable name.

OPTIONS
  -s, --stage=stage           Stage to operate within. May be provided multiple times.
  -t, --tag=TagName:TagValue  Tags to set on the variable as TagName:TagValue.

EXAMPLES
  # Set Client tag of FOO variable in test stage.
  $ ssmenv var:set test FOO --tag=Client:baz

  # Set multiple tags on FOO variable for staging.
  $ ssmenv var:set staging FOO --tag=Client:baz --tag=Environment:staging
```

_See code: [src/commands/var/tag.ts](https://github.com/oursiberia/ssmenv/blob/v0.5.0/src/commands/var/tag.ts)_
<!-- commandsstop -->
