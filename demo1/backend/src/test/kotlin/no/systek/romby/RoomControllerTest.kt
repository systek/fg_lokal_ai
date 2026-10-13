package no.systek.romby

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.reactive.server.WebTestClient

// The one sample test. Use it as a pattern and let your local model generate the rest.
@SpringBootTest
@AutoConfigureWebTestClient
class RoomControllerTest {

    @Autowired
    lateinit var client: WebTestClient

    @Test
    fun `lists the seeded rooms`() {
        client.get().uri("/api/rooms")
            .exchange()
            .expectStatus().isOk
            .expectBody()
            .jsonPath("$.length()").isEqualTo(4)
            .jsonPath("$[0].name").isEqualTo("Fjorden")
    }
}
