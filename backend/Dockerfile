FROM rust:1-bookworm AS builder
WORKDIR /app
COPY . .
RUN cargo install sqlx-cli --no-default-features --features postgres
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/backend .
COPY --from=builder /usr/local/cargo/bin/sqlx /usr/local/bin/sqlx
COPY --from=builder /app/migrations ./migrations
CMD ["./backend"]
