# cargo-chef
FROM rust:1-bookworm AS chef
RUN cargo install --locked cargo-chef
WORKDIR /app

# planner
FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# builder
FROM chef AS builder
RUN cargo install --locked sqlx-cli --no-default-features --features postgres
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release --locked

# prod
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/backend .
COPY --from=builder /usr/local/cargo/bin/sqlx /usr/local/bin/sqlx
COPY --from=builder /app/migrations ./migrations
ENV RUST_LOG=info
CMD ["./backend"]
