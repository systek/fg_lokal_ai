plugins {
    // Lets Gradle download the JDK requested by the toolchain (25) into ~/.gradle/jdks
    // if it isn't installed locally. Nothing is installed system-wide.
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

rootProject.name = "romby"
