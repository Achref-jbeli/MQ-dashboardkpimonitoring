# 📊 Dashboard KPI Monitoring

A full-stack KPI & project monitoring dashboard built with **ASP.NET Core 8** (backend) and **React + Vite** (frontend). It supports department-scoped dashboards, a public presentation loop, milestones, realization tracking, international business management, and more.

---

## 🗂️ Project Structure

```
DashboardKpiMonitoring/
├── backend/
│   ├── DashboardKpi.Api/          # ASP.NET Core Web API (controllers, startup)
│   ├── DashboardKpi.Application/  # DTOs, services
│   ├── DashboardKpi.Domain/       # Entities, domain models
│   └── DashboardKpi.Infrastructure/ # EF Core DbContext, Migrations
└── frontend/
    ├── src/
    │   ├── api/                   # Axios API clients
    │   ├── components/            # Reusable UI components
    │   ├── pages/                 # Page components per role
    │   ├── types/                 # TypeScript types
    │   └── theme/                 # Design tokens & CSS
    └── public/                    # Static assets (served at root)
```

---

## ✅ Prerequisites

Before you start, make sure you have:

| Tool | Version | Download |
|------|---------|----------|
| .NET SDK | 8.0+ | https://dotnet.microsoft.com/download |
| Node.js | 18+ | https://nodejs.org |
| SQL Server | 2019+ | https://www.microsoft.com/sql-server (or Docker) |
| EF Core CLI | latest | `dotnet tool install -g dotnet-ef` |

---

## ⚙️ Backend Setup

### 1. Configure the Database Connection

Open `backend/DashboardKpi.Api/appsettings.json` and set your SQL Server connection string:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost,1433;Database=DashboardKpiDB;User Id=sa;Password=YourPassword;TrustServerCertificate=True;"
}
```

> **Tip:** You can also use Windows Authentication: `Server=localhost;Database=DashboardKpiDB;Integrated Security=True;TrustServerCertificate=True;`

### 2. Apply Database Migrations

Run these commands from the `backend/DashboardKpi.Api/` directory:

```powershell
# Apply all pending migrations to the database
dotnet ef database update `
  --project ..\DashboardKpi.Infrastructure\DashboardKpi.Infrastructure.csproj `
  --startup-project .
```

This will create all tables including:
- `Employees`, `Projects`, `Tasks`, `Kpis`, `Events`
- `Milestones` — project milestone tracking
- `RealizationEntries` — admin-entered monthly planned/realized/target values
- `InternationalBusinesses` — new business portfolio
- And more…

### 3. Run the Backend

```powershell
cd backend/DashboardKpi.Api
dotnet run
```

The API will start on `http://localhost:5189` (or the port shown in the console).

---

## 🌐 Frontend Setup

### 1. Install Dependencies

```powershell
cd frontend
npm install
```

### 2. Configure API Base URL

Open `frontend/src/api/client.ts` (or `.env`) and confirm the backend URL matches:

```ts
baseURL: "http://localhost:5189/api"
```

### 3. Run the Frontend Dev Server

```powershell
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 👤 First-Time Login — SuperAdmin Account

The project seeds its initial accounts via `DatabaseSeeder.SeedInitialAdminAsync`, defined in
`backend/DashboardKpi.Infrastructure/Data/DatabaseSeeder.cs` and invoked from `Program.cs`.

### What Gets Seeded

On every application startup (except when running under the `Testing` environment), the seeder
idempotently ensures the following exist:

- **Business units**: `HMI`, `HIS`, `Performance`
- A **`PM` department** under the `Performance` business unit
- A **Manager** account: `pm.manager@dashboard.local` (Role: `Manager`) — seeded with **no password
  set**, so it cannot be used to log in until you set one (e.g. via the password-reset flow or by
  updating its `PasswordHash` directly).
- A **SuperAdmin** account hard-coded to the email `greenala139@gmail.com`, with a `PasswordHash`
  value that is baked into `DatabaseSeeder.cs` as a PBKDF2 hash (`salt.hash`, see
  `backend/DashboardKpi.Infrastructure/Authentication/PasswordHasher.cs`). **The plaintext password
  for this hash is not in the repository** — it cannot be recovered from the hash.

> ⚠️ This is **not** a "no users exist yet" gate — the seeder runs on every startup and will
> re-promote any employee matching `greenala139@gmail.com` back to SuperAdmin / the `PM` department
> even if you change their role afterwards.

### Getting Your Own First Login

Since the seeded SuperAdmin's password hash has an unknown plaintext, pick one before your first run:

1. **Set your own seed password (recommended for local dev).** In `DatabaseSeeder.cs`, change the
   `email` constant and generate a fresh hash by calling
   `new PasswordHasher().Hash("YourPassword123!")` (e.g. from a scratch console app or a temporary
   debug endpoint), then paste the result into the `PasswordHash` field of the `admin` object.
2. **Use the password-reset flow**, if you control the `greenala139@gmail.com` inbox and the SMTP
   settings under `Email` in `appsettings.json` are valid — the forgot-password flow
   (`ForgotPasswordCommandHandler` / `ResetPasswordCommandHandler`) will email a reset code to that
   address.

> ⚠️ **Change the seeded credentials before deploying anywhere shared.** `appsettings.json` also
> currently commits a live Gmail app password for that same address — rotate it and move it to user
> secrets / environment variables before this goes anywhere beyond your machine.

### Disabling the Seeder (Recommended for Production)

Once you have real accounts, remove or guard the seeder call in `backend/DashboardKpi.Api/Program.cs`:

```csharp
if (!app.Environment.IsEnvironment("Testing"))
{
    await DatabaseSeeder.SeedInitialAdminAsync(app.Services);
}
```

Delete this block (or add a stronger environment guard, e.g. `IsDevelopment()`) once you no longer
want the seeded Business Units / PM department / Manager / SuperAdmin records maintained automatically.

---

## 🔐 Roles & Access

| Role | Access |
|------|--------|
| **SuperAdmin** | Full system access, can manage all departments and users |
| **Administrator** | Department-scoped admin: projects, milestones, realization, events, international business |
| **Manager** | Overview, projects, milestones, international business, KPIs, teams |
| **TeamLeader** | My projects, milestones, international business, KPIs, my team |
| **Employee** | Personal dashboard (read-only) |

---

## 📽️ Public Presentation Mode

The public dashboard is a **kiosk-style looping presentation** accessible at `/public`. It auto-rotates through slides:

- HMI & HIS Maturity
- **Realization Status of VAVE Projects** (data entered by Admin in the Realization page)
- Milestones
- **Performance Dashboard** (includes Task Status pie chart)
- Adherence to Schedule
- Project Overview
- New Business (International Business cards)
- Events / Visits / Audits
- Calendar

> Files placed in the `frontend/public/` directory are served at the root path (e.g. `public/images/logo.png` → `/images/logo.png`).

---

## 📁 Key Features

### International Business
- **Eye icon** — toggles whether a business appears in the public presentation slide
- **Sparkles icon** — marks a business as "New" (shown with a NEW badge on cards)

### Realization Management (Admin/Manager)
- Admin can enter planned, realized, target, and forecast values **per month per year**
- Year selector allows switching between years
- Chart preview updates automatically after each save
- If manual entries exist, the public presentation uses them; otherwise falls back to computed values from KPIs/tasks

### Milestones
- Available to Admin, Manager, and TeamLeader
- Track project milestones with planned/actual dates, status, and delays

---

## 🛠️ Adding a New Migration

When you change a domain entity:

```powershell
cd backend/DashboardKpi.Api

dotnet ef migrations add YourMigrationName `
  --project ..\DashboardKpi.Infrastructure\DashboardKpi.Infrastructure.csproj `
  --startup-project .

dotnet ef database update `
  --project ..\DashboardKpi.Infrastructure\DashboardKpi.Infrastructure.csproj `
  --startup-project .
```

> ⚠️ Stop the running backend before running migrations to avoid DLL lock errors.

---

## 📦 Production Build (Frontend)

```powershell
cd frontend
npm run build
```

Output goes to `frontend/dist/`. Deploy it behind a static file server (Nginx, IIS, Azure Static Web Apps, etc.) and point the API base URL to your production backend.

---

## 🐛 Common Issues

| Problem | Fix |
|---------|-----|
| **DLL locked during migration** | Stop the `dotnet run` process first, then run migrations |
| **`Column already exists` migration error** | Manually insert the migration ID into `__EFMigrationsHistory` or modify the migration to skip the existing column |
| **Images not loading** | Check `PhotoController.cs` `AllowedCategories` includes the category you're uploading to |
| **Frontend shows old data** | Hard refresh with `Ctrl+Shift+R` (Vite HMR sometimes caches aggressively) |
| **CORS errors** | Ensure the frontend dev server URL is in the backend CORS policy in `Program.cs` |

---

## 📞 Contact

For questions about this codebase, refer to the original development team or the inline code comments.
