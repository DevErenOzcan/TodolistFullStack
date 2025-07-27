package database

import (
	"time"
	"todo_list_project/models"
)

// User service functions

func Authenticate(username, password string) (*models.User, bool) {
	var user models.User
	err := DB.Where("username = ? AND password = ? AND is_deleted = ?", username, password, false).First(&user).Error
	if err != nil {
		return nil, false
	}
	return &user, true
}

func GetUserByID(id uint) (*models.User, bool) {
	var user models.User
	err := DB.Where("id = ? AND is_deleted = ?", id, false).First(&user).Error
	if err != nil {
		return nil, false
	}
	return &user, true
}

func CreateUser(user models.User) (*models.User, error) {
	err := DB.Create(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func UpdateUser(id uint, updates models.User) (*models.User, error) {
	var user models.User
	err := DB.Where("id = ? AND is_deleted = ?", id, false).First(&user).Error
	if err != nil {
		return nil, err
	}

	updates.UpdatedDate = time.Now()
	err = DB.Model(&user).Updates(updates).Error
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func SoftDeleteUser(id uint) error {
	now := time.Now()
	return DB.Model(&models.User{}).Where("id = ? AND is_deleted = ?", id, false).
		Updates(map[string]interface{}{
			"is_deleted":   true,
			"deleted_date": &now,
			"updated_date": now,
		}).Error
}

func GetAllUsers() ([]models.User, error) {
	var users []models.User
	err := DB.Where("is_deleted = ?", false).Find(&users).Error
	return users, err
}
