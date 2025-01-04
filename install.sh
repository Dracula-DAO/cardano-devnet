#!/bin/sh

git submodule update --init --recursive
direnv allow
for dir in . explorer
do
  echo "installing packages in $dir"
  cd $dir && npm install; cd -
done

