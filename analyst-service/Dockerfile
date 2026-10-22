# ---- Build stage ----
FROM eclipse-temurin:25-jdk AS build
WORKDIR /workspace

# Warm the Gradle cache: copy only build inputs first.
COPY gradlew gradlew.bat settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle
COPY buildSrc ./buildSrc
RUN chmod +x gradlew && ./gradlew --no-daemon help >/dev/null 2>&1 || true

# Copy sources and build the boot jar (tests run in CI, not in the image build).
COPY src ./src
RUN ./gradlew --no-daemon clean bootJar -x test

# ---- Runtime stage ----
FROM eclipse-temurin:25-jre AS runtime
WORKDIR /app

# Non-root runtime user.
RUN groupadd --system analyst && useradd --system --gid analyst --home /app analyst
COPY --from=build /workspace/build/libs/*.jar /app/app.jar
USER analyst

EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
