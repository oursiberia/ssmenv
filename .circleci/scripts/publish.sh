#!/bin/bash
set -eux

# $CIRCLE_TAG should look like v<MAJOR>.<MINOR>.<PATCH>
# $CIRCLE_TAG may have an optional -TAG appended (v<MAJOR>.<MINOR>.<PATCH>-<TAG>)

# VERSION extracts by 'splitting' on the hyphen and taking the first part
# (field in `cut` terms).
VERSION=$(echo $CIRCLE_TAG | cut -c2- | cut -d '-' -f 1)
# VERSION_SUFFIX extracts by 'splitting' on the hyphen and taking the first
# part (field in `cut` terms).
VERSION_SUFFIX=$(echo $CIRCLE_TAG | cut -c2- | cut -d '-' -f 2 -s)
if [[ ! "__${VERSION_SUFFIX}" == "__" ]]; then
  # NPM_TAG defaults to "latest" but uses the value of the take if it is not
  # empty. Emptiness is determined by prefixing and checking if the result
  # matches the prefix exactly. Don't include the --npm-tag for `latest`
  # because it makes the publish command misbehave (as in not publish properly
  # but also not fail).
  NPM_TAG="latest"
  yarn lerna publish --repo-version="${VERSION}" --skip-git --yes
else
  # Use the values extracted earlier to execute the publish command.
  NPM_TAG=${VERSION_SUFFIX}
  yarn lerna publish --repo-version="${VERSION}" --skip-git --yes --npm-tag="${NPM_TAG}"
fi
