package controller

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
	"time"
	"todo_list_project/database"
	"todo_list_project/models"
)

func GetStepsByTodoID(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	todoID, _ := strconv.Atoi(c.Param("todo_id"))

	if !database.IsTodoOwnedByUser(uint(todoID), userID) {
		user, exists := database.GetUserByID(userID)
		if !exists || !user.IsSuperuser {
			c.JSON(http.StatusForbidden, gin.H{"error": "Yetkiniz yok"})
			return
		}
	}

	steps, err := database.GetStepsByTodoID(uint(todoID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch steps"})
		return
	}
	c.JSON(http.StatusOK, steps)
}

func CreateStep(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	todoID, _ := strconv.Atoi(c.Param("todo_id"))

	if !database.IsTodoOwnedByUser(uint(todoID), userID) {
		user, exists := database.GetUserByID(userID)
		if !exists || !user.IsSuperuser {
			c.JSON(http.StatusForbidden, gin.H{"error": "Yetkiniz yok"})
			return
		}
	}

	var newStep models.TodoStep
	if err := c.ShouldBindJSON(&newStep); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newStep.TodoID = uint(todoID)
	// Set timestamps
	now := time.Now()
	newStep.CreatedDate = now
	newStep.UpdatedDate = now

	// Set default values if not provided
	newStep.IsDeleted = false

	createdStep, err := database.AddStep(newStep)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create step"})
		return
	}
	c.JSON(http.StatusCreated, createdStep)
}

func GetStepByID(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	stepID, _ := strconv.Atoi(c.Param("step_id"))

	step, err := database.GetStepByID(uint(stepID))
	if err != nil || step == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Step not found"})
		return
	}

	if !database.IsTodoOwnedByUser(step.TodoID, userID) {
		user, exists := database.GetUserByID(userID)
		if !exists || !user.IsSuperuser {
			c.JSON(http.StatusForbidden, gin.H{"error": "Yetkiniz yok"})
			return
		}
	}

	c.JSON(http.StatusOK, step)
}

func UpdateStep(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	stepID, _ := strconv.Atoi(c.Param("step_id"))

	step, err := database.GetStepByID(uint(stepID))
	if err != nil || step == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Step not found"})
		return
	}

	if !database.IsTodoOwnedByUser(step.TodoID, userID) {
		user, exists := database.GetUserByID(userID)
		if !exists || !user.IsSuperuser {
			c.JSON(http.StatusForbidden, gin.H{"error": "Yetkiniz yok"})
			return
		}
	}

	var updated models.TodoStep
	if err := c.ShouldBindJSON(&updated); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedStep, err := database.UpdateStepByID(uint(stepID), updated)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update step"})
		return
	}

	// eğer step tamamlanmışsa bağlı olduğu todo daki percenti güncelliyorum.
	if updatedStep.IsCompleted {
		percent := CalculatePercent(int(step.TodoID))
		todo, err := database.GetTodoByID(step.TodoID)
		if err == nil && todo != nil {
			todo.CompletePerc = percent
			_, err = database.UpdateTodoByID(todo.ID, *todo)
			if err != nil {
				// Log error but don't fail the request
				// You could add proper logging here
			}
		}
	}
	c.JSON(http.StatusOK, updatedStep)
}

func DeleteStep(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	stepID, _ := strconv.Atoi(c.Param("step_id"))

	step, err := database.GetStepByID(uint(stepID))
	if err != nil || step == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Step not found"})
		return
	}

	if !database.IsTodoOwnedByUser(step.TodoID, userID) {
		user, exists := database.GetUserByID(userID)
		if !exists || !user.IsSuperuser {
			c.JSON(http.StatusForbidden, gin.H{"error": "Yetkiniz yok"})
			return
		}
	}

	err = database.SoftDeleteStepByID(uint(stepID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete step"})
		return
	}

	// todo daki percenti güncelliyorum.
	percent := CalculatePercent(int(step.TodoID))
	todo, err := database.GetTodoByID(step.TodoID)
	if err == nil && todo != nil {
		todo.CompletePerc = percent
		_, err = database.UpdateTodoByID(todo.ID, *todo)
		if err != nil {
			// Log error but don't fail the request
			// You could add proper logging here
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Step deleted"})
}

func CalculatePercent(TodoId int) float64 {
	steps, err := database.GetStepsByTodoID(uint(TodoId))
	if err != nil || len(steps) == 0 {
		return 0.0
	}

	var completedCount int
	for _, step := range steps {
		if step.IsCompleted && !step.IsDeleted {
			completedCount++
		}
	}

	percent := (float64(completedCount) / float64(len(steps))) * 100
	return percent
}
