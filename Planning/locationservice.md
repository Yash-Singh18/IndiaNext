You are helping me implement the second enterprise microservice for our cyber defense platform.

We already built Microservice #1 (Prompt Injection Detection). Now we need Microservice #2.

This service detects suspicious login activity based on sudden location changes (Impossible Travel Detection).

This service will have a **dummy login system for demo purposes** instead of real authentication.

---

MICROSERVICE NAME

Login Anomaly Detection Service

---

FEATURE OVERVIEW

This microservice detects suspicious logins by analyzing the geographic location of login attempts.

Example suspicious case:

User logs in from:
India → and within 1 second logs in from Russia.

This is physically impossible and should be flagged as suspicious.

---

TECH STACK

Frontend:
React + Tailwind

Backend:
fastapi if needed

Database:
Supabase (only used for storing login events)

Location detection:
IP Geolocation API (ipapi or ipinfo)

---

LOGIN SYSTEM

Use a **dummy login system**.

The login form will only ask for:

email
password

No real authentication is needed.

The backend should simply accept any email/password combination and generate a mock user_id based on the email.

Example:

user_id = hash(email)

---

USER FLOW

1. User opens a new webpage: /login-anomaly

2. User enters email and password.

3. Backend accepts the login (dummy login).

4. Backend captures the user's IP address.

5. Backend detects location using an IP geolocation API.

6. Store login event in Supabase.

7. Fetch previous login for the same user.

8. Run anomaly detection.

---

DATABASE SCHEMA

Table: login_events

Columns:

id (uuid)
user_id
email
ip_address
country
city
latitude
longitude
timestamp
risk_level

---

ANOMALY DETECTION LOGIC

When user logs in:

1. Fetch the previous login event for the same user.

2. Calculate:

distance between locations

time difference between logins

3. Compute travel speed:

speed = distance / time

If speed > 900 km/h

flag login as suspicious.

Example:

India → Russia in 1 second
distance ≈ 5000 km
speed ≈ 18,000,000 km/h

This should trigger a high-risk alert.

---

BACKEND API

POST /api/login

Steps:

1. accept email/password
2. generate user_id from email
3. capture IP address
4. fetch geo location
5. fetch previous login event
6. calculate travel distance
7. detect anomaly
8. store login event in Supabase
9. return result

Example response:

{
"login_status": "SUCCESS",
"location": "Mumbai, India",
"risk": "LOW"
}

Suspicious response:

{
"login_status": "SUCCESS",
"location": "Moscow, Russia",
"risk": "HIGH",
"reason": "Impossible travel detected"
}

---

FRONTEND PAGE

Create a new webpage:

/login-anomaly

Page contains:

Login form
Email
Password
Login button

After login show:

Current login location
Previous login location
Risk level
Alert if suspicious login detected

---

UI DESIGN

Use Tailwind.

Display:

Green card → normal login

Red alert card → suspicious login

---

OPTIONAL DEMO FEATURE

Add a button:

"Simulate Suspicious Login"

This will generate a fake login from another country (like Russia) to demonstrate anomaly detection during the demo.

---

PROJECT STRUCTURE

/backend
/routes
/controllers
/services
/utils

/frontend
/pages
/components

---

Generate the full backend and frontend implementation.

User Login
     ↓
Capture IP
     ↓
Geolocation Lookup
     ↓
Fetch Previous Login
     ↓
Impossible Travel Detection
     ↓
Risk Engine
     ↓
IF suspicious
     ↓
Send Alert to Company (Telegram Bot)
     ↓
Store Event in Supabase