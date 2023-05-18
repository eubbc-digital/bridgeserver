#!/bin/sh
node app.js &
./public/utils/websockify/run --verbose 6080 $VNC_SERVER_IP_ADDRESS:$VNC_SERVER_PORT --file-only
