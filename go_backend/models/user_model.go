package models

import "time"

type User struct {
	ID          uint       `json:"id"`
	Username    string     `json:"username"`
	Password    string     `json:"password"`
	IsSuperuser bool       `json:"is_superuser"`
	IsDeleted   bool       `json:"is_deleted"`
	CreatedDate time.Time  `json:"created_date"`
	UpdatedDate time.Time  `json:"updated_date"`
	DeletedDate *time.Time `json:"deleted_date,omitempty"`
}
