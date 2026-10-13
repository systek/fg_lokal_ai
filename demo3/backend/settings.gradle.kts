plugins {
    // Lets Gradle download the JDK requested by the toolchain (25) into ~/.gradle/jdks
    // if it is not installed locally. Run one build online before going offline.
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

rootProject.name = "kanban-lite"
