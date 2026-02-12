package config

import "os"

type Config struct {
	DatabaseURL string
	Addr        string
}

func Load() Config {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/pvz?sslmode=disable"
	}
	addr := os.Getenv("ADDR")
	if addr == "" {
		addr = ":8080"
	}
	return Config{
		DatabaseURL: dbURL,
		Addr:        addr,
	}
}
