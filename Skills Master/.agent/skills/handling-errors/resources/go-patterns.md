# Go Error Handling Patterns

## Explicit Error Returns
```go
func getUser(id string) (*User, error) {
    user, err := db.QueryUser(id)
    if err != nil {
        return nil, fmt.Errorf("failed to query user: %w", err)
    }
    if user == nil {
        return nil, errors.New("user not found")
    }
    return user, nil
}
```

## Error Checking
```go
user, err := getUser("123")
if err != nil {
    if errors.Is(err, ErrNotFound) {
        // Handle not found
    } else {
        // Handle other errors
    }
}
```

## Error Wrapping and As
```go
func processUser(id string) error {
    user, err := getUser(id)
    if err != nil {
        return fmt.Errorf("process user failed: %w", err)
    }
    return nil
}

// Unwrap with errors.As
var valErr *ValidationError
if errors.As(err, &valErr) {
    fmt.Printf("Validation error: %s\n", valErr.Field)
}
```
