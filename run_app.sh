#!/bin/sh
node app.js &
./public/utils/websockify/run --verbose $SERVICE_PORT $VNC_SERVER_IP_ADDRESS:$VNC_SERVER_PORT --file-only
