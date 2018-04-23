# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog][kac] and this project adheres to
[Semantic Versioning][semver].

[kac]: http://keepachangelog.com/en/1.0.0/
[semver]: http://semver.org/spec/v2.0.0.html

# v0.6.2 (2018-04-23)

Republish v0.6.1 but automatically.

# v0.6.1 (2018-04-23)

## Added

* Export the `Configuration` type which provides is used to enable access to
  the API of the AWS SSM Parameter Store.
* Export the `Tag` type which provides information about AWS tags attached to a
  resource.
* Add the static `Environment.listAll` method to retrieve an array of all the
  path names which could be used as Environments (because they have leaf
  nodes).

# v0.6.0 (2018-04-23)

## Added

* `Environment` can be constructed with either an `AWS.SSM` instance or with a
  configuration object. If given a configuration object `Environment` will use
  it to create an `AWS.SSM` instance.

## Fixed

* Fixes linting errors revealed by stricter linting rules.

# v0.5.5 (2018-04-16)

Republish v0.5.0 but with the source files this time.

# v0.5.0 (2018-04-16)

**This is a rebranding of the `ssmenv` package. All CLI functionality has been
moved to `ssmenv-cli`.**

## Added

* Exports `AwsSsmProxy` and `Environment` classes.
* Exports `EnvironmentOptions` and `EnvironmentVariable` types.
