package database

import (
	"time"
	"todo_list_project/models"
)

// TodoStep service functions

func GetStepsByTodoID(todoID uint) ([]models.TodoStep, error) {
	var steps []models.TodoStep
	err := DB.Where("todo_id = ? AND is_deleted = ?", todoID, false).Find(&steps).Error
	return steps, err
}

func AddStep(newStep models.TodoStep) (*models.TodoStep, error) {
	err := DB.Create(&newStep).Error
	if err != nil {
		return nil, err
	}
	return &newStep, nil
}

func GetStepByID(id uint) (*models.TodoStep, error) {
	var step models.TodoStep
	err := DB.Where("id = ? AND is_deleted = ?", id, false).First(&step).Error
	if err != nil {
		return nil, err
	}
	return &step, nil
}

func UpdateStepByID(id uint, updates models.TodoStep) (*models.TodoStep, error) {
	var step models.TodoStep
	err := DB.Where("id = ? AND is_deleted = ?", id, false).First(&step).Error
	if err != nil {
		return nil, err
	}

	updates.UpdatedDate = time.Now()
	err = DB.Model(&step).Updates(updates).Error
	if err != nil {
		return nil, err
	}

	return &step, nil
}

func ToggleStepCompletion(id uint) (*models.TodoStep, error) {
	var step models.TodoStep
	err := DB.Where("id = ? AND is_deleted = ?", id, false).First(&step).Error
	if err != nil {
		return nil, err
	}

	step.IsCompleted = !step.IsCompleted
	step.UpdatedDate = time.Now()
	err = DB.Save(&step).Error
	if err != nil {
		return nil, err
	}

	return &step, nil
}

func SoftDeleteStepByID(id uint) error {
	now := time.Now()
	return DB.Model(&models.TodoStep{}).Where("id = ? AND is_deleted = ?", id, false).
		Updates(map[string]interface{}{
			"is_deleted":   true,
			"deleted_date": &now,
			"updated_date": now,
		}).Error
}

func GetAllSteps() ([]models.TodoStep, error) {
	var steps []models.TodoStep
	err := DB.Where("is_deleted = ?", false).Find(&steps).Error
	return steps, err
}
