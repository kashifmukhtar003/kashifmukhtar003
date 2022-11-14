npm install --global yarn
npm i -g electron-packager
npm i -g electron-installer-debian
sudo apt-get -y install fakeroot
npm i --legacy-peer-deps
echo "SENTRY_DSN=${{ secrets.SENTRY_DSN }}" >> .env
npm run build:linux
npm run package:linux
pwd
