package no.systek.reiseregning.claim

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

data class ErrorResponse(val message: String)

@RestController
@RequestMapping("/api/claims")
class ClaimController(private val service: ClaimService) {

    @GetMapping
    fun list(): Flux<ClaimDto> = service.listClaims()

    @GetMapping("/{id}")
    fun get(@PathVariable id: Long): Mono<ClaimDto> = service.getClaim(id)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: NewClaimRequest): Mono<ClaimDto> = service.createClaim(request)

    /** One endpoint for all status changes: POST /api/claims/42/submit, .../approve, .../reject */
    @PostMapping("/{id}/{action}")
    fun action(
        @PathVariable id: Long,
        @PathVariable action: String,
        @RequestBody request: ClaimActionRequest,
    ): Mono<ClaimDto> = service.performAction(id, action, request)

    @ExceptionHandler
    @ResponseStatus(HttpStatus.NOT_FOUND)
    fun notFound(e: ClaimNotFoundException) = ErrorResponse(e.message ?: "Not found")

    @ExceptionHandler
    @ResponseStatus(HttpStatus.CONFLICT)
    fun conflict(e: IllegalStateException) = ErrorResponse(e.message ?: "Conflict")

    @ExceptionHandler
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun badRequest(e: IllegalArgumentException) = ErrorResponse(e.message ?: "Bad request")
}
