package no.systek.romby

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class RombyApplication

fun main(args: Array<String>) {
    runApplication<RombyApplication>(*args)
}
