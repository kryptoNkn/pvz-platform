package routes

import (
	"database/sql"
	"net/http"

	"github.com/labstack/echo/v4"
)

func Register(e *echo.Echo, _db *sql.DB) {
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})
}
