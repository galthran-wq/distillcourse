from collections.abc import Callable, Coroutine
from typing import Any

from fastapi import HTTPException, Request, Response, status
from fastapi.routing import APIRoute


def size_limited(max_bytes: int) -> type[APIRoute]:
    """A route class that turns an oversized body away before FastAPI reads it.

    A dependency could not: the body is read before dependencies are solved, so
    the caps a pydantic model declares only ever apply to a body already
    buffered whole. caddy holds the same ceiling for a request that declares no
    length at all.
    """

    class SizeLimited(APIRoute):
        def get_route_handler(
            self,
        ) -> Callable[[Request], Coroutine[Any, Any, Response]]:
            handler = super().get_route_handler()

            async def refuse_oversized(request: Request) -> Response:
                declared = request.headers.get("content-length", "")
                if declared.isdigit() and int(declared) > max_bytes:
                    raise HTTPException(
                        status.HTTP_413_CONTENT_TOO_LARGE, "request body too large"
                    )
                return await handler(request)

            return refuse_oversized

    return SizeLimited
