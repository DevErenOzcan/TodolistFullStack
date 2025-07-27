package controller

import (
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"net/http"
	"time"
	"todo_list_project/database"
)

var jwtKey = []byte("jwtsecretkey")

func Index(c *gin.Context) {
	c.HTML(http.StatusOK, "index.html", gin.H{"title": "Ana Sayfa"})
}

func Login(c *gin.Context) {
	username := c.PostForm("username")
	password := c.PostForm("password")

	user, ok := database.Authenticate(username, password)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Kullanıcı adı veya şifre yanlış"})
		return
	}

	claims := jwt.MapClaims{
		"username": user.Username,
		"user_id":  user.ID,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token oluşturulamadı"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Giriş başarılı", "token": tokenString, "username": user.Username})
}

func Todo(c *gin.Context) {
	c.HTML(http.StatusOK, "todo.html", gin.H{"title": "Todos"})
}

func Step(c *gin.Context) {
	c.HTML(http.StatusOK, "step.html", gin.H{"title": "Steps"})
}
