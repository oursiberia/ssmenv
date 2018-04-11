# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog][kac] and this project adheres to
[Semantic Versioning][semver].

[kac]: http://keepachangelog.com/en/1.0.0/
[semver]: http://semver.org/spec/v2.0.0.html

# 0.3.0 ([since v0.2.0](https://github.com/oursiberia/ssmenv/compare/v0.2.0...v0.3.0)) (2018-04-09)

## Added

* Create `env:list` command to list all paths recognized as environments in
  AWS SSM Parameter Store. Closes
  [#8](https://github.com/oursiberia/ssmenv/issues/8)
* Add `--quiet` flag to `init` command to suppress informational output.
* Create `var:del` command which deletes a variable from the stage or
  environment indicated by the positional stage argumnet.

## Fixed

* Create explicit command for `ssmenv env` and `ssmenv var`. Closes
  [#7](https://github.com/oursiberia/ssmenv/issues/7)
