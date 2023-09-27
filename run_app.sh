#!/bin/sh

# Copyright (c) Universidad Privada Boliviana (UPB) - EUBBC-Digital
# MIT License - See LICENSE file in the root directory
# Boris Pedraza, Alex Villazon

node app.js &
./public/utils/websockify/run --verbose 6080 $VNC_SERVER_IP_ADDRESS:$VNC_SERVER_PORT --file-only
