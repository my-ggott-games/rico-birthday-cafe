# Build stage
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY src src
RUN chmod +x ./gradlew
RUN ./gradlew bootJar -x test

# Run stage (Optimized for Render / Docker Runtime)
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

# Render/Fly/Railway may inject PORT; default to 8080 locally.
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Xmx512m -Dserver.port=${PORT:-8080} -jar app.jar"]
