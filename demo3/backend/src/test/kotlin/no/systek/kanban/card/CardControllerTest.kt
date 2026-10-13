package no.systek.kanban.card

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.reactive.server.WebTestClient
import org.springframework.test.web.reactive.server.expectBody
import kotlin.test.assertEquals

/**
 * The one sample test. Use it as a template when asking the assistant
 * to generate more (see exercise 2 in the README).
 */
@SpringBootTest
@AutoConfigureWebTestClient
class CardControllerTest(@Autowired private val client: WebTestClient) {

    @Test
    fun `creating a card puts it in TODO`() {
        client.post().uri("/api/cards")
            .bodyValue(CreateCardRequest(title = "Write more tests", assignee = "Kari", priority = Priority.HIGH))
            .exchange()
            .expectStatus().isCreated
            .expectBody<CardDto>()
            .consumeWith { result ->
                val card = requireNotNull(result.responseBody)
                assertEquals("Write more tests", card.title)
                assertEquals(CardStatus.TODO, card.status)
            }
    }
}
