---
name: handling-errors
description: Implements resilient error handling strategies to resolve application issues and improve reliability. Use when debugging, designing APIs, or building fault-tolerant systems.
---

# Handling Errors & Troubleshooting

Build resilient applications that gracefully handle failures and provide excellent debugging experiences. This skill focuses on both identifying and fixing issues using robust patterns.

## When to use this skill
- Implementing error handling in new features.
- Debugging production issues or application failures.
- Designing error-resilient APIs and distributed systems.
- Improving application reliability and fault tolerance.

## Troubleshooting Workflow
- [ ] **Reproduce the Issue**: Confirm the bug or failure in a controlled environment.
- [ ] **Trace the Root Cause**: Follow the stack trace or logs to the source of the failure.
- [ ] **Categorize the Error**: Is it a transient failure (network), a logic bug (code), or a resource exhaustion (memory)?
- [ ] **Apply the Fix**: 
    - Use **Exceptions** for truly unexpected states.
    - Use **Result Types** for expected failures (e.g., validation).
    - Implement **Cleanup** logic (try-finally) to prevent resource leaks.
- [ ] **Enhance Resilience**: Add **Retry** logic for transient errors or a **Circuit Breaker** for external dependencies.
- [ ] **Verify & Log**: Ensure the fix works and that future occurrences are properly logged with context.

## Universal Resilience Patterns

### 1. Circuit Breaker
Prevents cascading failures by rejecting requests when a service is failing.
👉 **[See Python Circuit Breaker](resources/python-patterns.md#circuit-breaker)**

### 2. Error Aggregation
Collects multiple validation errors instead of failing on the first one.
👉 **[See JS/TS Error Collector](resources/js-ts-patterns.md#error-aggregation)**

### 3. Graceful Degradation
Provides fallback functionality when the primary service fails.
👉 **[See Fallback Patterns](resources/python-patterns.md#graceful-degradation)**

## Language-Specific Implementation
Consult the specific resources for implementation details:
- **[Python Patterns](resources/python-patterns.md)**: Custom hierarchies, context managers, and retry decorators.
- **[JS/TS Patterns](resources/js-ts-patterns.md)**: Custom Error classes, Result types, and async handling.
- **[Rust Patterns](resources/rust-patterns.md)**: Result/Option types and the `?` operator.
- **[Go Patterns](resources/go-patterns.md)**: Explicit error returns and wrapping.

## Best Practices
- **Fail Fast**: Validate input early.
- **Meaningful Messages**: Explain what happened and how to fix it.
- **Don't Swallow Errors**: Log or re-throw; never ignore silently.
- **Clean Up**: Always use `try-finally` or context managers for resources.
