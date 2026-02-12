package main

import (
	"log"
	"pvz-platform/backend/internal/config"
	"pvz-platform/backend/internal/db"
	"pvz-platform/backend/internal/routes"

	"github.com/labstack/echo/v4"
)

func main() {
	cfg := config.Load()

	sqlDB, err := db.New(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to db: %v", err)
	}
	defer sqlDB.Close()

	e := echo.New()
	routes.Register(e, sqlDB)
	e.Logger.Fatal(e.Start(cfg.Addr))
}
