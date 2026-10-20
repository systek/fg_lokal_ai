/** Throw from anywhere to answer with a given status and message (like Spring's ResponseStatusException). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

/** Wraps a route handler so a thrown ApiError becomes a { status, message } JSON response. */
export function handleErrors<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (e) {
      if (e instanceof ApiError) {
        // The frontend reads "message" from error responses.
        return Response.json({ status: e.status, message: e.message }, { status: e.status })
      }
      throw e // anything else is a bug: let Next.js answer 500 and log it
    }
  }
}
