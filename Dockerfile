FROM alpine:3.13.5

ENV VNC_SERVER "research.upb.edu:5901"
ENV NOVNC_TAG="v1.4.0"

#COPY vnc.html /app/index.html
#COPY vnc.html /app/
#COPY app /app/app
#COPY core /app/core
#COPY vendor /app/vendor
#COPY utils /app/utils
#COPY package.json /app/

RUN apk --no-cache --update --upgrade add \
    bash \
    python3 \
    python3-dev \
    py-pip \
    build-base \
    procps \
    git

RUN pip install --no-cache-dir numpy

RUN git clone https://github.com/novnc/noVNC --branch ${NOVNC_TAG} /app
RUN ln -s /usr/bin/python3 /usr/bin/python

COPY app /app/app
COPY vnc.html /app/vnc.html
COPY vnc.html /app/index.html
COPY alert_page.html /app/alert_page.html

WORKDIR /app

ENTRYPOINT [ "bash", "-c", "/app/utils/novnc_proxy --vnc ${VNC_SERVER}" ]