package database

import (
	"time"
	"todo_list_project/models"
)

// Todo service functions

func GetTodosByUser(userID uint) ([]models.Todo, error) {
	var todos []models.Todo
	user, exists := GetUserByID(userID)
	if !exists {
		return nil, nil
	}

	if user.IsSuperuser {
		// Superuser can see all todos
		err := DB.Where("is_deleted = ?", false).Find(&todos).Error
		return todos, err
	} else {
		// Regular user can only see their own todos
		err := DB.Where("user_id = ? AND is_deleted = ?", userID, false).Find(&todos).Error
		return todos, err
	}
}

func AddTodo(newTodo models.Todo) (*models.Todo, error) {
	err := DB.Create(&newTodo).Error
	if err != nil {
		return nil, err
	}
	return &newTodo, nil
}

func GetTodoByID(id uint) (*models.Todo, error) {
	var todo models.Todo
	err := DB.Where("id = ? AND is_deleted = ?", id, false).First(&todo).Error
	if err != nil {
		return nil, err
	}
	return &todo, nil
}

func UpdateTodoByID(id uint, updates models.Todo) (*models.Todo, error) {
	var todo models.Todo
	err := DB.Where("id = ? AND is_deleted = ?", id, false).First(&todo).Error
	if err != nil {
		return nil, err
	}

	updates.UpdatedDate = time.Now()
	err = DB.Model(&todo).Updates(updates).Error
	if err != nil {
		return nil, err
	}

	return &todo, nil
}

func SoftDeleteTodoByID(id uint) error {
	now := time.Now()
	return DB.Model(&models.Todo{}).Where("id = ? AND is_deleted = ?", id, false).
		Updates(map[string]interface{}{
			"is_deleted":   true,
			"deleted_date": &now,
			"updated_date": now,
		}).Error
}

func IsTodoOwnedByUser(todoID, userID uint) bool {
	var count int64
	DB.Model(&models.Todo{}).Where("id = ? AND user_id = ? AND is_deleted = ?", todoID, userID, false).Count(&count)
	return count > 0
}

func GetAllTodos() ([]models.Todo, error) {
	var todos []models.Todo
	err := DB.Where("is_deleted = ?", false).Find(&todos).Error
	return todos, err
}
