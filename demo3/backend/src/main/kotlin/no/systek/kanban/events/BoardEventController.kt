package no.systek.kanban.events

import org.springframework.http.MediaType
import org.springframework.http.codec.ServerSentEvent
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Flux
import java.time.Duration

@RestController
class BoardEventController(private val eventBus: BoardEventBus) {

    /**
     * Server-Sent Events stream. The browser's EventSource keeps this HTTP response
     * open and reconnects automatically if it drops.
     */
    @GetMapping("/api/board/events", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun events(): Flux<ServerSentEvent<BoardEvent>> {
        val changes = eventBus.events().map { event ->
            ServerSentEvent.builder(event)
                .event("board")
                .build()
        }
        // A comment line every 15 s stops proxies and load balancers from closing an idle stream
        val heartbeat = Flux.interval(Duration.ofSeconds(15)).map {
            ServerSentEvent.builder<BoardEvent>().comment("keep-alive").build()
        }
        return Flux.merge(changes, heartbeat)
    }
}
