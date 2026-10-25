FROM eclipse-temurin:8-jre

COPY runtime/siddhi/ /opt/siddhi/
COPY siddhi-app/ /opt/siddhi-app/
COPY docker/siddhi/entrypoint.sh /usr/local/bin/cep4fun-siddhi-entrypoint.sh

RUN sed -i 's/\r$//' /opt/siddhi/bin/*.sh /usr/local/bin/cep4fun-siddhi-entrypoint.sh \
 && chmod +x /opt/siddhi/bin/*.sh /usr/local/bin/cep4fun-siddhi-entrypoint.sh

EXPOSE 1080
ENTRYPOINT ["/usr/local/bin/cep4fun-siddhi-entrypoint.sh"]
