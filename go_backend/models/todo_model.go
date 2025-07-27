package models

import "time"

type Todo struct {
	ID           uint       `json:"id"`
	Name         string     `json:"name"`
	UserID       uint       `json:"user_id"`
	CompletePerc float64    `json:"complete_perc"`
	IsDeleted    bool       `json:"is_deleted"`
	CreatedDate  time.Time  `json:"created_date"`
	UpdatedDate  time.Time  `json:"updated_date"`
	DeletedDate  *time.Time `json:"deleted_date,omitempty"`

	// Foreign key relationship (for GORM queries only)
	User User `json:"user,omitempty"`
}
