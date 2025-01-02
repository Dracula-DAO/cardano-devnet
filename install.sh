#!/bin/sh

git submodule update --init --recursive
direnv allow
for dir in . explorer
do
  npm install
done

