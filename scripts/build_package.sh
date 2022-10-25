#!/bin/bash
npm run build:linux
dpkg-deb --build --root-owner-group /home/player/DCH-P/build/app/dchp
echo "Package has been created"