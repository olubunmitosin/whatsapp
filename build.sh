#!/bin/bash
APPNAME=whatsapp
VERSION=1.0.0
electron-packager . $APPNAME --platform=linux --arch=x64 --version=$VERSION --overwrite=true --asar=false --app_version=0.0.1 --appname=$APPNAME --out=releases --overwrite=true --icon=images/app.png
