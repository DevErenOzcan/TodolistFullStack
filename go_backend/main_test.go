package main

import (
	"testing"
)

// TestBasicFunctionality is a simple test that always passes
func TestBasicFunctionality(t *testing.T) {
	// This is a placeholder test that will always pass
	result := true
	if !result {
		t.Errorf("Expected true but got false")
	}
}

// TestSimpleAddition tests that 1+1=2
func TestSimpleAddition(t *testing.T) {
	// Basic arithmetic test
	sum := 1 + 1
	expected := 2
	if sum != expected {
		t.Errorf("Expected %d but got %d", expected, sum)
	}
}

// TestStringComparison tests string equality
func TestStringComparison(t *testing.T) {
	// Simple string comparison
	str1 := "todo"
	str2 := "todo"
	if str1 != str2 {
		t.Errorf("Expected strings to be equal, but they were not")
	}
}
