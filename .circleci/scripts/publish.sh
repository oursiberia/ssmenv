#!/bin/sh
set -eux

# $CIRCLE_TAG should look like v<MAJOR>.<MINOR>.<PATCH>
# $CIRCLE_TAG may have an optional -TAG appended (v<MAJOR>.<MINOR>.<PATCH>-<TAG>)

# VERSION extracts by 'splitting' on the hyphen and taking the first part
# (field in `cut` terms).
VERSION=$(echo $CIRCLE_TAG | cut -d '-' -f 1)
# VERSION_SUFFIX extracts by 'splitting' on the hyphen and taking the first
# part (field in `cut` terms).
VERSION_SUFFIX=$(echo $CIRCLE_TAG | cut -d '-' -f 2 -s)
# NPM_TAG defaults to "latest" but uses the value of the take if it is not
# empty. Emptiness is determined by prefixing and checking if the result
# matches the prefix exactly.
NPM_TAG="latest"
if [[ ! "__${VERSION_SUFFIX}" == "__" ]]; then
  NPM_TAG=${VERSION_SUFFIX}
fi
# Use the values extracted earlier to execute the publish command.
yarn lerna publish --repo-version="${VERSION}" --skip-git --yes --npm-tag="${NPM_TAG}"
