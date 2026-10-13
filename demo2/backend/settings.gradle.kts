plugins {
    // Downloads the JDK requested by the toolchain in build.gradle.kts (into ~/.gradle/jdks)
    // if it isn't installed, so nobody has to install Java 25 by hand.
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

rootProject.name = "reiseregning"
