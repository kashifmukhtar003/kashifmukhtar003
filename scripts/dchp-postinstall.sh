#!/bin/bash
sudo mkdir /usr/lib/dchp/realm
sudo mkdir /usr/lib/dchp/realm/default
sudo chown -R player:player /usr/lib/dchp
sudo chmod -R 777 /usr/lib/dchp/realm
sudo cp /usr/lib/dchp/scripts/dchp.service /etc/systemd/system/
sudo cp /usr/lib/dchp/scripts/dchp /etc/default/
sudo chown -R player:player /etc/default/dchp
sudo cp /usr/lib/dchp/scripts/.env /usr/lib/dchp
sudo chown player:player /etc/default/dchp
sudo chown -R player:player /etc/systemd/system/dchp.service
systemctl daemon-reload
systemctl start dchp.service
systemctl enable dchp.service
echo "Debian Package post install script run successfully"