#! /bin/bash

BASE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
. $BASE/../functions.cfg;

set -e;

ava test;
progress "Tests passed";
