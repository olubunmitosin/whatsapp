#!/bin/bash
APPNAME=whatsapp
VERSION=1.2.3
electron-packager . $APPNAME --platform=linux --arch=x64 --app-version=$VERSION --overwrite=true --app_version=1.2.3 --appname=$APPNAME --out=releases --overwrite=true --icon=images/app.png
