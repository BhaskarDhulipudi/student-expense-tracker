# Student Expense Tracker

A clean, responsive, offline-first web application for tracking personal/student expenses.

## What this version does
- No income field
- No monthly budget field
- Monthly total spending
- Daily spending average
- Highest spending category
- Transaction count
- Category breakdown
- Add/delete expenses
- UPI, cash, card, bank transfer and other payment methods
- Student-friendly categories
- Works offline using IndexedDB + service worker
- Syncs local data to MySQL through Spring Boot when internet/server is available
- Responsive on desktop and mobile

## Technology
- Java 17
- Spring Boot 3.5.3
- Spring Data JPA / Hibernate
- MySQL
- HTML/CSS/JavaScript
- IndexedDB
- PWA service worker

## Run in Eclipse
1. Extract the project.
2. Eclipse → File → Import → Maven → Existing Maven Projects.
3. Select the `student-expense-tracker` folder.
4. In MySQL run:

```sql
CREATE DATABASE student_expenses;
```

5. Open `src/main/resources/application.properties` and change `CHANGE_ME` to your MySQL password.
6. Run `StudentExpenseTrackerApplication.java`.
7. Open `http://localhost:8080`.

## Mobile testing on the same Wi-Fi
Find your computer IPv4 address with `ipconfig`. If it is for example `192.168.1.10`, open `http://192.168.1.10:8080` on the phone while both devices are on the same Wi-Fi. Windows Firewall may need port 8080 allowed.

For a real internet-accessible PWA and reliable service-worker installation, deploy the app over HTTPS.

## Important
This is the clean MVP foundation. It does not yet have login/authentication or multi-user separation. Do not expose it publicly until authentication and per-user data isolation are added.
