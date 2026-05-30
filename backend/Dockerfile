ARG RUST_IMAGE=rust:1.96.0-bookworm
ARG RUNTIME_IMAGE=debian:12.14-slim
FROM ${RUST_IMAGE} AS chef
WORKDIR /app
ENV CARGO_BUILD_JOBS=1

RUN cargo install --locked cargo-chef

FROM chef AS planner
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
ARG BUILD_REV=local
ENV CARGO_BUILD_JOBS=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates libssl-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

RUN cargo install --locked sqlx-cli --no-default-features --features postgres

COPY --from=planner /app/recipe.json recipe.json

RUN cargo chef cook --release --recipe-path recipe.json

COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN echo "building revision: ${BUILD_REV}" >/dev/null \
    && cargo build --release --locked --bin backend \
    && if command -v strip >/dev/null 2>&1; then strip target/release/backend; fi

FROM ${RUNTIME_IMAGE} AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates gosu libssl3 wget \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 --create-home --home-dir /home/app app \
    && mkdir -p /app/uploads \
    && chown -R app:app /app

WORKDIR /app

COPY --from=builder --chown=app:app /app/target/release/backend ./backend
COPY --from=builder --chown=app:app /usr/local/cargo/bin/sqlx /usr/local/bin/sqlx
COPY --chown=app:app migrations ./migrations
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod 755 /usr/local/bin/docker-entrypoint.sh

ENV RUST_LOG=info

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:${PORT:-8080}/api/ready || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["./backend"]
