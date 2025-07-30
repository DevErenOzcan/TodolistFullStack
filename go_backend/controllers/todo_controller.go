package controller

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
	"time"
	"todo_list_project/database"
	"todo_list_project/models"
)

func GetAllTodos(c *gin.Context) {
	userID := c.GetUint("user_id")
	todos, err := database.GetTodosByUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch todos"})
		return
	}
	c.JSON(http.StatusOK, todos)
}

func CreateTodo(c *gin.Context) {
	var newTodo models.Todo
	if err := c.ShouldBindJSON(&newTodo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set user ID from JWT token
	newTodo.UserID = c.GetUint("user_id")

	// Set timestamps
	now := time.Now()
	newTodo.CreatedDate = now
	newTodo.UpdatedDate = now

	// Set default values if not provided
	if newTodo.CompletePerc == 0 {
		newTodo.CompletePerc = 0.0
	}
	newTodo.IsDeleted = false

	created, err := database.AddTodo(newTodo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create todo"})
		return
	}
	c.JSON(http.StatusCreated, created)
}

func GetTodoByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	todo, err := database.GetTodoByID(uint(id))
	if err != nil || todo == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	userID := c.GetUint("user_id")
	user, exists := database.GetUserByID(userID)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if !user.IsSuperuser && todo.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}
	c.JSON(http.StatusOK, todo)
}

func UpdateTodo(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	todo, err := database.GetTodoByID(uint(id))
	if err != nil || todo == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	userID := c.GetUint("user_id")
	user, exists := database.GetUserByID(userID)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if !user.IsSuperuser && todo.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	var updated models.Todo
	if err := c.ShouldBindJSON(&updated); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := database.UpdateTodoByID(uint(id), updated)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update todo"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func DeleteTodo(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	todo, err := database.GetTodoByID(uint(id))
	if err != nil || todo == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	userID := c.GetUint("user_id")
	user, exists := database.GetUserByID(userID)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if !user.IsSuperuser && todo.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	err = database.SoftDeleteTodoByID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Delete failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Todo deleted"})
}
