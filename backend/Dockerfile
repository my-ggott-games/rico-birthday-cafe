# syntax=docker/dockerfile:1.7

FROM amazoncorretto:17-alpine-jdk AS build
WORKDIR /app

COPY gradlew .
COPY gradle ./gradle
COPY build.gradle settings.gradle ./
COPY src ./src

RUN chmod +x ./gradlew && ./gradlew --no-daemon bootJar -x test

FROM amazoncorretto:17-alpine
WORKDIR /app

COPY --from=build /app/build/libs/*.jar app.jar

# Render/Fly/Railway may inject PORT; default to 8080 locally.
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "exec java -Xmx512m -Dserver.port=${PORT:-8080} -jar /app/app.jar"]
