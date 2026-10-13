package no.systek.kanban.events

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import reactor.core.publisher.Flux
import reactor.core.publisher.Sinks

/**
 * In-process pub/sub for board changes. Fine for a single instance;
 * with several instances you would need a broker (or Postgres LISTEN/NOTIFY).
 */
@Component
class BoardEventBus {

    private val log = LoggerFactory.getLogger(javaClass)

    // multicast: one sink, many subscribers (one per open SSE connection).
    // directBestEffort: a slow subscriber misses events instead of holding up the
    // others, and nothing is buffered while nobody is listening.
    private val sink: Sinks.Many<BoardEvent> = Sinks.many().multicast().directBestEffort()

    // A Sink must not be emitted to from several threads at once, and requests are
    // handled on many event-loop threads, so emission is serialised here.
    @Synchronized
    fun publish(event: BoardEvent) {
        val result = sink.tryEmitNext(event)
        if (result.isFailure && result != Sinks.EmitResult.FAIL_ZERO_SUBSCRIBER) {
            log.warn("Dropped board event {}: {}", event.type, result)
        }
    }

    fun events(): Flux<BoardEvent> = sink.asFlux()
}
