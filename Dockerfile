FROM node:16-alpine

ENV NOVNC_TAG="v1.4.0"
ENV WEBSOCKIFY_TAG="v0.11.0"

WORKDIR /app

RUN apk --no-cache --update --upgrade add \
    bash \
    python3 \
    python3-dev \
    py-pip \
    build-base \
    procps \
    git

RUN pip install --no-cache-dir numpy

RUN mkdir public

RUN git config --global advice.detachedHead false && \
  git clone https://github.com/novnc/noVNC --branch ${NOVNC_TAG} /app/public && \
  git clone https://github.com/novnc/websockify --branch ${WEBSOCKIFY_TAG} /app/public/utils/websockify

COPY app.js /app/app.js
COPY webpage_files/app /app/public/app
COPY webpage_files/vnc.html /app/public/index.html
COPY webpage_files/alert_page.html /app/public/alert_page.html
COPY run_app.sh /app/run_app.sh
RUN sed -i 's/\r$//' /app/run_app.sh && chmod +x /app/run_app.sh
COPY package*.json ./

RUN npm install

CMD ./run_app.sh
