# Environment Management via AWS SSM

This monorepo contains a CLI tool and a node library intended to ease
management of environment variable sharing across development teams by storing
the variables and values in the AWS SSM Parameter Store.

## ssmenv

[`ssmenv`][env] is the node library underpinning the CLI tool. It provides a
wrapper around the [AWS SDK][awssdk] in order to treat the contents of the
Parameter Store at a specific Path similar to how [dotenv][dotenv] treats an
environment file.

[awssdk]: https://github.com/aws/aws-sdk-js
[dotenv]: https://www.npmjs.com/package/dotenv
[env]: packages/ssmenv

## ssmenv-cli

[`ssmenv-cli`][cli] is the command line tool (built on top of [oclif][oclif])
which provides a simpler interface for varlues which will be recognized as
environment variables by the `ssmenv` library.

[cli]: packages/ssmenv-cli

## Development

[Lerna][lerna] is used to bootstrap `ssmenv` into `ssmenv-cli` so the local
version of `ssmenv` can be used in development of `ssmenv-cli`. The versions of
`ssmenv` and `ssmenv-cli` have thus far been kept in sync for the sake of
simplicity in tags but the `lerna` tool is not being used for releases and the
only no enforcement for synced versions is the current setup of
[CircleCI][circleci].

[lerna]: https://lernajs.io
[circleci]: https://circleci.com/gh/oursiberia/ssmenv

During feature development it is important to modify the CHANGELOG for the
appropriate package. The `CHANGELOG.md` files are written using [Keep A
Changelog][kac] style changelogs.

[kac]: https://keepachangelog.com/en/1.0.0/

## Tests

Tests are executed using [jest][jest]. The root project has a `test` script
used to execute the tests in watch mode. By default this only executes tests
that have been modified since the last commit.

    yarn test

[jest]: https://facebook.github.io/jest/

## Releases

Releases are prepared manually on the `master` branch. After any changes have been merged:

1. The version of each package is updated via `yarn`.
1. The CHANGELOG of each package is updated to indicate the new version.
1. A commit indicating the new version number is written (it includes the
   `package.json`, `README.md` and `CHANGELOG.md` changes from the previous
   actions.
1. A signed and annotated git tag is created for the new version. The tag
   comment should include the changes from `CHANGELOG.md` from all packages.

    # Update package version
    export SSMENV_NEXT_VERSION=1.2.3
    for p in `ls packages`; do
      pushd "packages/${p}"
      yarn version --new-version=${SSMENV_NEXT_VERSION}
      popd
    done
    # Update version in CHANGELOG header
    # Review contents of the commit
    git commit -m "v${SSMENV_NEXT_VERSION}"
    git tag -a -s "v${SSMENV_NEXT_VERSION}"

Pushing the tag will trigger a CircleCI build that includes release jobs. The
release jobs perform the work of publishing the packages to NPM.

