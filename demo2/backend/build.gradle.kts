plugins {
    kotlin("jvm") version "2.4.21"
    // Opens Spring-annotated classes so Spring can proxy them (Kotlin classes are final by default).
    kotlin("plugin.spring") version "2.4.21"
    id("org.springframework.boot") version "4.1.1"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "no.systek"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")
    // Spring Boot 4 uses Jackson 3, which moved from com.fasterxml.jackson to tools.jackson.
    implementation("tools.jackson.module:jackson-module-kotlin")
    implementation("io.projectreactor.kotlin:reactor-kotlin-extensions")
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    // In-memory database: no Docker, no external server - the demo runs fully offline.
    runtimeOnly("io.r2dbc:r2dbc-h2")

    // Spring Boot 4 has one test starter per technology. Both pull in spring-boot-starter-test and reactor-test.
    testImplementation("org.springframework.boot:spring-boot-starter-webflux-test")
    testImplementation("org.springframework.boot:spring-boot-starter-data-r2dbc-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

kotlin {
    compilerOptions {
        // Treat Spring's nullability annotations strictly, so platform types become proper Kotlin types.
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}
