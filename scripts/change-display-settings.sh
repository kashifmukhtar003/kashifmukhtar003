#!/bin/bash

Display_Resolution=$1
Refresh_Rate=$2

if [ $# -eq 0 ]; then
 echo "no arguments"
 exit 1
else
echo "Display_Resolution: $1"
echo "Refresh_Rate: $2"
xrandr -s $Display_Resolution -r $Refresh_Rate
echo  “ Screen resolution settings are $Display_Resolution and Refresh Rate will be $Refresh_Rate >> /tmp/dis.log ”
fi