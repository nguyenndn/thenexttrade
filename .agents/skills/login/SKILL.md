---
name: login
description: Login to the app via browser for testing. Auto-login before any browser test.
---

// turbo-all

# /login - Browser Auto-Login

## Credentials

Credentials must be loaded from `.env.local`:
- **Email:** `process.env.USER_QA_EMAIL`
- **Password:** `process.env.USER_QA_PASSWORD`

## Steps

1. Read `USER_QA_EMAIL` and `USER_QA_PASSWORD` from `.env.local`
2. Navigate to `http://localhost:3000/auth/login`
3. Find the email input and type the value of `USER_QA_EMAIL`
4. Find the password input and type the value of `USER_QA_PASSWORD`
5. Click the login/submit button
6. Wait for redirect to `/dashboard`

## Usage

Before any browser test that requires authentication, run this workflow first.
The browser subagent should include these login steps at the START of every authenticated test task.
