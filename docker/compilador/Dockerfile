FROM eclipse-temurin:17-jre

# solc y vyper como binarios Linux estáticos/autocontenidos en compiler/ (misma
# versión que los .exe de Windows: solc 0.8.34, vyper 0.4.3). No hace falta pip
# ni apt: cero red en el build.
COPY compiler/compilador.jar /opt/compilador/compilador.jar
COPY compiler/solc/solc-static-linux /usr/local/bin/solc
COPY compiler/vyper/vyper.0.4.3.linux /usr/local/bin/vyper
RUN chmod +x /usr/local/bin/solc /usr/local/bin/vyper

ENV COMPILADOR_SOLC_RUTA=/usr/local/bin/solc \
    COMPILADOR_VYPER_RUTA=/usr/local/bin/vyper

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/opt/compilador/compilador.jar"]
