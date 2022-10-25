#/bin/bash

# Define Veriables
Connection_name=$1
Interface_name=`ip -o -4 route show to default | awk '{print $5}'`
IP_Address=$3
DNS=$4
RouteMetric=$5
DHCP=$6
if [[ $# -eq 0 || $6 -eq 0 ]]
then
 echo "no arguments or You have set DHCP True"
 exit 1
else
echo "Connection_name: $1"
echo "Interface_name: $Interface_name"
echo "IP_Address: $3"
echo "DNS: $4"
echo "RouteMetric: $5"
echo "DHCP: $6"

nmcli con delete id $1 
nmcli con add type ethernet con-name $1 ifname $Interface_name ipv4.method manual ipv4.addresses $3 ipv4.dns $4 ipv4.route-metric $5  autoconnect yes
#nmcli con down id $1
nmcli con up id $1
fi