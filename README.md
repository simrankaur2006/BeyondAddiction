# 🌿 Beyond Addiction

**A recovery and wellness platform designed to support healthier habits, self-reflection, and long-term recovery.**

Beyond Addiction is a web application that brings recovery tracking, personal journaling, goal management, wellness analytics, and support resources together in one place.

## ✨ Features

- 📊 **Dashboard** — A central view of recovery progress and activity.
- 💚 **My Recovery** — A dedicated space for tracking your recovery journey.
- 📅 **Daily Check-in** — Record daily progress and reflect on your day.
- 🎯 **Goals and Habits** — Set goals and build healthier routines.
- 📔 **Journal** — Maintain personal reflections and track your journey.
- 📈 **Analytics** — Visualize progress and identify patterns.
- 👥 **Community** — Access community-oriented support features.
- 📚 **Resources** — Explore educational and recovery resources.
- 🔖 **Saved Resources** — Keep useful resources accessible.
- ⚙️ **Profile and Settings** — Manage your profile and preferences.
- 🆘 **Help and Support** — Find support information and helplines.

## 🛠️ Tech Stack

- **Frontend:** React
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Backend and Database:** Supabase
- **Icons:** Lucide React
- **Deployment:** Vercel
- **Version Control:** Git and GitHub

## 🚀 Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm
- A Supabase account

### 1. Clone the repository

```bash
git clone https://github.com/simrankaur2006/BeyondAddiction.git
cd BeyondAddiction/ba
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the `ba` directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Replace the placeholders with your own Supabase project credentials.

**Security:** Never expose your Supabase secret or service-role key in frontend code.

### 4. Configure the database

1. Open your Supabase project.
2. Navigate to the SQL Editor.
3. Run the database setup script provided in the project's `supabase` directory, if available.
4. Verify that the required tables and Row Level Security policies are configured.

### 5. Run locally

```bash
npm run dev
```

Open the local URL displayed in your terminal, usually `http://localhost:5173`.

### 6. Build for production

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## 🌐 Live Demo

**[Beyond Addiction — Live Website](https://beyondaddiction.vercel.app/)**

## 🔐 Environment and Security

- Keep `.env` out of version control.
- Use Supabase Row Level Security to protect user data.
- Use only publishable credentials in browser-side code.
- Configure authentication redirect URLs for your deployed domain.

## 🎯 Project Objective

The goal of Beyond Addiction is to provide an accessible digital space for self-monitoring, healthier habit formation, recovery reflection, and discovering support resources.

The platform is intended to complement—not replace—professional medical care or mental health support.

## 👩‍💻 Author

**Simran Kaur**

- GitHub: [@simrankaur2006](https://github.com/simrankaur2006)

## 📄 License

A license has not yet been specified. Add a `LICENSE` file if you intend to distribute this project under an open-source license.
