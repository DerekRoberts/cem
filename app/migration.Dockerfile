FROM mhart/alpine-node:12
ENV NO_UPDATE_NOTIFIER=true
WORKDIR /opt/app-root/src
COPY ./ .

RUN npm run all:ci
RUN chmod +x /opt/app-root/src/bin/run-migrations.sh
CMD ["/bin/sh"]
