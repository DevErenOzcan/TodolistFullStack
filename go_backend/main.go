package main

import (
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"os"
	"strings"
	"time"
	"todo_list_project/middleware"
	"todo_list_project/routes"
)

func main() {
	origins := os.Getenv("CORS_ALLOW_ORIGINS")
	fmt.Println("origins:", origins)
	allowOrigins := strings.Split(origins, ",")

	r := gin.Default()

	// Add Prometheus metrics middleware
	r.Use(middleware.PrometheusMiddleware())

	// CORS middleware'i uygula
	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Cookie"},
		ExposeHeaders:    []string{"Content-Length", "Set-Cookie"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Yeni route yapısını kullan
	routes.SetupRoutes(r)

	// Sunucuyu başlat
	r.Run(":8080")
}
