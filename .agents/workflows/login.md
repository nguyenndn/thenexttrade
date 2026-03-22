---
description: Login to the app via browser for testing. Auto-login before any browser test.
---

// turbo-all

# /login - Browser Auto-Login

## Credentials

- **Email:** keezimin@gmail.com
- **Password:** loveyou25

## Steps

1. Navigate to `http://localhost:3000/auth/login`
2. Find the email input and type `keezimin@gmail.com`
3. Find the password input and type `loveyou25`
4. Click the login/submit button
5. Wait for redirect to `/dashboard`

## Usage

Before any browser test that requires authentication, run this workflow first.
The browser subagent should include these login steps at the START of every authenticated test task.
