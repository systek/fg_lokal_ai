package no.systek.reiseregning

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class ReiseregningApplication

fun main(args: Array<String>) {
    runApplication<ReiseregningApplication>(*args)
}
