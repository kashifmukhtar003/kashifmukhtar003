#!/bin/bash

#### Variables ####

NETWORK_SETTINGS=$(jq '.cards' dchp-settings.json > /tmp/99-cinemataztic-network-manager.yaml)
IP=$(ip a |grep ens33 |grep inet)
Resolution=$(jq -r '.display.Resolution' dchp-settings.json)
Refresh_Rate=$(jq -r '.display.Refresh_Rate' dchp-settings.json)
Card=$(jq -r '.audio.card'  dchp-settings.json)
Active_Profile=$(jq -r '.audio.Active_Profile'  dchp-settings.json)


### Network Settings ###
echo
echo  """"""""""""""""Network Settings""""""""""""""""

sudo cp /etc/netplan/99-cinemataztic-network-manager.yaml /opt
sudo mv /tmp/99-cinemataztic-network-manager.yaml /etc/netplan/99-cinemataztic-network-manager.yaml
sudo netplan try
sudo netplan apply
echo  """"""""""""""Network Settings"""""""""""""""" >> /tmp/logs/cinemataztic.log
echo  IP sets to $IP >> /tmp/logs/cinemataztic.log 
sleep 2

### Display  Settings ###

echo
echo """"""""""""""""Display Settings""""""""""""""""

export DISPLAY=:0
xrandr -s $Resolution -r $Refresh_Rate
echo  """"""""""""""Display Settings"""""""""""""""" >> /tmp/logs/cinemataztic.log
echo  Screen resolution settings are $Resolution and Refresh Rate will be $Refresh_Rate >> /tmp/logs/cinemataztic.log

sleep 2

### Sound Settings ###

echo
echo """"""""""""""""Sound Settings""""""""""""""""

pactl set-card-profile $Card $Active_Profile
echo  """"""""""""""Sound  Settings"""""""""""""""" >> /tmp/logs/cinemataztic.log
echo Default sound cards sets to $Card and Active Profile $Active_Profile >> /tmp/logs/cinemataztic.log

sleep 2

echo 

tail -n 6 /tmp/logs/cinemataztic.log