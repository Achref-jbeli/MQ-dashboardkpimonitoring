Here's a detailed prompt you can give to **Figma AI** to improve the design and fix the UX issues.

---

# Figma AI Prompt

Redesign and improve this enterprise KPI dashboard for **Marquardt** using the colors from the uploaded logo. Use the logo's turquoise/teal as the primary color and build a modern corporate color palette with lighter and darker shades.

## Color Palette

Primary Color

* #00B5C8 (Marquardt Turquoise)

Secondary Shades

* #009FB0
* #008A99
* #33C7D6
* #66D8E3
* #BEEFF4

Neutral Colors

* #FFFFFF
* #F6F9FC
* #EEF4F7
* #DCE5EA
* #6B7280
* #1F2937

Use gradients based on the turquoise palette for cards, charts, buttons and highlights while keeping the interface clean and professional.

---

# Public Dashboard

Design a full-screen dashboard optimized for TV displays.

## Dashboard Rotation

There are two Business Units:

* HMI
* HIS

The dashboard automatically rotates every **3 seconds** between the two business units with a smooth fade animation.

Display a countdown such as

"Switching to HIS in 00:03"

or

"Switching to HMI in 00:03"

The active Business Unit should always be highlighted.

---

## IMPORTANT UX FIX

Currently, when Live Transition is paused, clicking the inactive Business Unit does not switch the dashboard.

Fix this behavior.

Requirements:

* When Live Transition is paused, clicking **HMI** immediately loads the HMI dashboard.
* Clicking **HIS** immediately loads the HIS dashboard.
* Manual switching should always work regardless of autoplay.
* Display a visible Pause/Play button for Live Mode.

---

## KPI Cards

Top row should include

* VA (Value Added)
* VE (Value Engineering)
* Total Projects
* Budget Consumption

Modern glassmorphism cards with subtle shadows and icons.

---

## SOP Section

Display

* Schedule Adherence
* Project Status
* On Track
* Delayed
* At Risk

Use circular progress indicators and progress bars.

---

## Maturity Dashboard

Display maturity score using

* Radar Chart
  or
* Spider Chart

Include

* Planning
* Execution
* Quality
* Delivery

---

## New Business Section

Display international projects.

Include

* Country Flag
* Country Name
* Project Count
* Revenue
* Contract Value

---

# Team Section (New)

Replace the simple birthday list with a full Team section.

Include

* Employee Photo
* Name
* Position
* Department
* Business Unit
* Online/Offline status
* Birthday icon if today is their birthday

Allow

* Search employees
* Filter by Business Unit
* View All Employees button

Design employee cards with rounded corners and hover animations.

---

# Calendar

Do NOT permanently display a full calendar.

Instead

The top navigation contains a Calendar icon.

When clicked,

open a modern popup calendar (modal or dropdown).

Inside the popup show

* Monthly calendar
* Today's birthdays
* Company events
* Holidays
* Upcoming meetings

Include quick navigation

Previous Month

Next Month

Today

---

# Birthday Celebration

Redesign the birthday notification.

Do NOT use a small notification.

Instead create a beautiful overlay similar to a celebration card.

Include

Large employee photo

Happy Birthday message

Employee Name

Business Unit

Department

Animated confetti

Gradient background using Marquardt colors

Rounded corners

Auto-close after 5–7 seconds

The birthday popup should appear only once during each dashboard rotation cycle to avoid distracting users.

---

# Login Page

Design a premium login page.

Use the Marquardt branding.

Split layout.

Left side

* Company illustration
* Dashboard preview
* Welcome text

Right side

Login Form

Fields

* Email
* Password

Buttons

* Login

Links

* Forgot Password

Include Remember Me checkbox.

Modern rounded inputs with soft shadows.

---

# Admin Dashboard

Create a separate Admin interface.

Sidebar

* Dashboard
* Projects
* Business Units
* KPI Management
* Employees
* Birthdays
* Calendar
* Events
* Reports
* Settings

Main Features

Manage Projects

Manage Employees

Manage Business Units

Manage KPIs

Manage SOP Metrics

Manage Maturity Scores

Manage International Business

Manage Calendar Events

Upload Employee Photos

Import Data from APIs

View Reports

Role Management

System Settings

Analytics Overview

---

# Manager Dashboard

Create another dashboard specifically for Managers.

Managers have fewer permissions than Admins.

Sidebar

* Dashboard
* Projects
* Employees
* KPIs
* Calendar
* Reports

Managers can

* View KPIs
* Update project progress
* Update project status
* Approve project information
* View team
* View birthdays
* Generate reports

Managers cannot

* Create users
* Delete users
* Change system settings

---

# Style

Design inspired by

* Microsoft Power BI
* SAP Fiori
* Tableau
* Azure Portal
* Modern SaaS dashboards

Use

* Soft shadows
* Glassmorphism
* Rounded corners (12–16 px)
* Spacious layout
* Smooth animations
* Consistent iconography
* Excellent spacing
* Fully responsive desktop design

The final result should look like a premium enterprise dashboard suitable for a global manufacturing company, with the Marquardt turquoise branding consistently applied throughout the entire interface.
