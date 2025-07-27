package models

import "time"

type TodoStep struct {
	ID          uint       `json:"id"`
	TodoID      uint       `json:"todo_id"`
	Name        string     `json:"name"`
	IsCompleted bool       `json:"is_completed"`
	IsDeleted   bool       `json:"is_deleted"`
	CreatedDate time.Time  `json:"created_date"`
	UpdatedDate time.Time  `json:"updated_date"`
	DeletedDate *time.Time `json:"deleted_date,omitempty"`

	// Foreign key relationship (for GORM queries only)
	Todo Todo `json:"todo,omitempty"`
}
