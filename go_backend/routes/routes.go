package routes

import (
	"todo_list_project/controllers"
	"todo_list_project/middleware"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// SetupRoutes tüm route'ları yapılandırır
func SetupRoutes(router *gin.Engine) {
	// Add Prometheus metrics endpoint
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// API grubu oluştur
	api := router.Group("/api")

	// Auth endpoints - JWT middleware olmadan
	authGroup := api.Group("/auth")
	{
		authGroup.POST("/login", controller.Login)
	}

	// Protected endpoints - JWT middleware ile
	protectedGroup := api.Group("")
	protectedGroup.Use(middleware.JWTMiddleware("jwtsecretkey"))
	{
		// Todo endpoints
		todoGroup := protectedGroup.Group("/todos")
		{
			todoGroup.GET("", controller.GetAllTodos)
			todoGroup.POST("", controller.CreateTodo)
			todoGroup.GET("/:id", controller.GetTodoByID)
			todoGroup.PUT("/:id", controller.UpdateTodo)
			todoGroup.DELETE("/:id", controller.DeleteTodo)
		}

		// Step endpoints
		stepGroup := protectedGroup.Group("/steps")
		{
			// Todo ID ile step işlemleri
			stepGroup.GET("/todo/:todo_id", controller.GetStepsByTodoID)
			stepGroup.POST("/todo/:todo_id", controller.CreateStep)

			// Step ID ile işlemler
			stepGroup.GET("/:step_id", controller.GetStepByID)
			stepGroup.PUT("/:step_id", controller.UpdateStep)
			stepGroup.DELETE("/:step_id", controller.DeleteStep)
		}
	}
}
