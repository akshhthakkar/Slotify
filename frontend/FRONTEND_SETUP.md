# Slotify Frontend Setup Guide

## Installation

```bash
cd frontend
npm install
```

## Configuration

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Slotify
```

## Run Development Server

```bash
npm run dev
```

The app will open at http://localhost:3000

## Build for Production

```bash
npm run build
```

## Project Structure

```
frontend/
├── public/               # Static assets
├── src/
│   ├── components/       # Reusable components
│   │   ├── common/       # ✅ Button, Input, Loading, Modal
│   │   ├── layout/       # Navbar, Footer, Sidebar
│   │   ├── auth/         # Login/Register forms
│   │   ├── booking/      # Booking flow components
│   │   ├── appointments/ # Appointment management
│   │   ├── business/     # Business components
│   │   ├── admin/        # Admin dashboard components
│   │   └── staff/        # Staff components
│   ├── pages/            # Page components
│   ├── context/          # ✅ AuthContext
│   ├── hooks/            # ✅ useApi
│   ├── utils/            # ✅ api, dateHelpers, validators
│   ├── App.jsx           # ✅ Main app with routing
│   ├── main.jsx          # ✅ Entry point
│   └── index.css         # ✅ Tailwind + global styles
├── index.html            # ✅ HTML template
├── vite.config.js        # ✅ Vite configuration
├── tailwind.config.js    # ✅ Tailwind configuration
├── postcss.config.js     # ✅ PostCSS configuration
└── package.json          # ✅ Dependencies

```

## Features Included

### ✅ Complete & Working:
- Vite + React 18 setup
- Tailwind CSS with custom utilities
- React Router v6 with protected routes
- Axios API client with interceptors
- Authentication context
- Toast notifications (react-hot-toast)
- Common UI components (Button, Input, Loading, Modal)
- Date utilities (date-fns)
- Form validation utilities
- Responsive design utilities

### ⏳ Needs Implementation:
- Layout components (Navbar, Footer)
- All page components
- Booking flow components
- Admin dashboard components
- Staff components

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool (faster than Create React App)
- **Tailwind CSS** - Utility-first CSS
- **React Router v6** - Routing
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **date-fns** - Date utilities
- **react-hot-toast** - Toast notifications
- **lucide-react** - Icons

## Key Features

### Protected Routes
```jsx
// Automatically redirects to login if not authenticated
<ProtectedRoute allowedRoles={['customer']}>
  <CustomerDashboard />
</ProtectedRoute>
```

### API Client
```jsx
import { authAPI, appointmentAPI } from './utils/api';

// Login
const { data } = await authAPI.login({ email, password });

// Get appointments
const appointments = await appointmentAPI.getAll({ status: 'scheduled' });
```

### Authentication Context
```jsx
import { useAuth } from './context/AuthContext';

const { user, isAuthenticated, login, logout } = useAuth();
```

### Form Validation
```jsx
import { validateEmail, getPasswordStrength } from './utils/validators';

const emailError = validateEmail(email) ? null : 'Invalid email';
const passwordStrength = getPasswordStrength(password);
```

## Next Steps

1. Create layout components (Navbar, Footer)
2. Create all page components
3. Implement booking flow
4. Build admin dashboard
5. Add staff management UI
6. Connect to backend API
7. Test all user flows
8. Deploy to Vercel

## Deployment

### Deploy to Vercel (Free)

1. Push code to GitHub
2. Go to vercel.com
3. Import repository
4. Set environment variables:
   - `VITE_API_URL` = your production API URL
5. Deploy!

Vercel automatically:
- Detects Vite configuration
- Builds the project
- Provides HTTPS
- Gives you a custom domain

## Tips

1. **Start with Pages**: Create page components first with basic structure
2. **Then Components**: Build reusable components as needed
3. **Use Common Components**: Button, Input, Loading, Modal are ready to use
4. **Follow Patterns**: Existing code shows best practices
5. **Mobile First**: Tailwind makes responsive design easy

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### API Connection Error
- Check `VITE_API_URL` in `.env`
- Ensure backend is running on correct port
- Check CORS configuration in backend

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Design System

### Colors
- Primary: Indigo/Blue theme
- Success: Green
- Danger: Red
- Warning: Yellow

### Component Classes
- `.btn` - Base button styles
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.btn-danger` - Danger/delete button
- `.input` - Input field
- `.label` - Form label
- `.card` - Card container

### Responsive Breakpoints
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px
- `2xl:` - 1536px

Happy coding! 🚀
