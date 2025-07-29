# Notification Manager - Frontend

![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router)

A modern React-based frontend for managing TV notification displays across multiple screens. This application provides both administrative controls for content management and real-time TV display interfaces with dynamic content rotation.

## 🚀 Features

### 🖥️ TV Display System
- **Multi-TV Support**: Manage content for 4 separate TV displays (TV1-TV4)
- **Dynamic Content Rotation**: Automatic cycling between different content types every 10 seconds
- **Real-time Environmental Data**: Live temperature, pressure, and time displays
- **Custom Content Integration**: Seamless integration with backend-scheduled content
- **Responsive Design**: Optimized for various screen sizes and resolutions

### 👑 Administrative Panel
- **Content Scheduling**: Schedule notifications with start/end times
- **Multi-format Support**: Text, single images, dual images, quad images, and embed content
- **TV Targeting**: Select specific TVs for content display
- **Real-time Management**: Create, edit, delete, and toggle content schedules
- **Image Upload**: Support for multiple image uploads based on content type

### 🔐 Authentication & Security
- **Role-based Access**: Admin and user roles with different permissions
- **Secure Authentication**: HTTP Basic authentication with the Spring Boot backend
- **Protected Routes**: Admin panel accessible only to authorized users
- **Persistent Sessions**: Local storage-based session management

### 🎨 User Interface
- **Modern Design**: Clean, professional interface with gradient backgrounds
- **Responsive Sidebar**: Collapsible navigation for TV selection
- **Interactive Navigation**: Easy switching between different TV displays
- **Loading States**: Visual feedback during API operations
- **Error Handling**: Comprehensive error messages and validation

## 🏗️ Architecture

### Component Structure
```
src/
├── components/           # Reusable UI components
│   ├── AdminPanel.js    # Admin dashboard for content management
│   ├── Login.js         # Authentication form
│   ├── Signup.js        # User registration form
│   └── SharedTVComponent.js # Base TV display component
├── tvpages/             # Individual TV page components
│   ├── tv1.js          # TV1 specific configuration
│   ├── tv2.js          # TV2 specific configuration
│   ├── tv3.js          # TV3 specific configuration
│   └── tv4.js          # TV4 specific configuration
├── utils/               # Utility functions and hooks
│   ├── authenticatedApi.js      # API authentication utilities
│   ├── contentScheduleUtils.js  # Content management utilities
│   ├── tvUtils.js              # TV display utilities
│   ├── useTVLogic.js           # Custom hook for TV logic
│   └── debugUser.js            # Development debugging utilities
└── styles/              # CSS styling
    ├── base.css         # Base layout and utilities
    ├── admin.css # Main admin panel styles (imports modular files)
    ├── admin/           # Modular admin styles directory
    │   ├── base.css     # Admin base layout
    │   ├── tabs.css     # Tab navigation
    │   ├── forms.css    # Form styling
    │   ├── tv-selectors.css # TV selection components
    │   ├── content-types.css # Content type selectors
    │   ├── file-upload.css # File upload components
    │   ├── schedules.css # Schedule management
    │   ├── schedule-list.css # Schedule display
    │   ├── profiles.css # Profile management
    │   ├── uploads.css  # Upload display
    │   ├── embed.css    # Embed content styling
    │   ├── responsive.css # Responsive design
    │   └── overrides.css # Global overrides
    ├── auth.css         # Authentication forms styling
    ├── navbar.css       # Navigation bar styling
    ├── sidebar.css      # Sidebar navigation styling
    ├── tvpage.css       # TV display styling
    └── welcome.css      # Welcome page styling
```

### Key Technologies
- **React 19.1.0**: Latest React with concurrent features
- **React Router DOM 7.6.3**: Client-side routing
- **CSS3**: Custom styling with modern features (Grid, Flexbox, CSS Variables)
- **Fetch API**: HTTP client for backend communication
- **Local Storage**: Client-side session persistence

## 🔧 Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Running Spring Boot backend (see [Backend Setup](#backend-integration))

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/HyperDarkmoon/notifmanager.git
   cd notifmanager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Ensure backend is running on http://localhost:8090

### Available Scripts
- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run test suite
- `npm eject` - Eject from Create React App (irreversible)

## 🔌 Backend Integration

You can find the backend repository [here](https://github.com/HyperDarkmoon/notificationbackend).

This frontend connects to a Spring Boot backend with the following endpoints:

### Authentication Endpoints
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration

### Content Management Endpoints
- `GET /api/content/tv/{tvId}` - Fetch content for specific TV
- `POST /api/content` - Create new content schedule
- `PUT /api/content/{id}` - Update content schedule
- `DELETE /api/content/{id}` - Delete content schedule
- `GET /api/content` - Fetch all content schedules

### Security Configuration
The backend uses Spring Security with role-based access:
- `/api/auth/**` - Public access
- `/api/content/tv/**` - Authenticated users (TV content viewing)
- `/api/content/**` - Admin only (content management)
- `/api/admin/**` - Admin only

> **Note**: Refer to `backend-security-fix.md` for detailed backend security configuration.

## 🎯 Core Features Deep Dive

### TV Display System

Each TV display shows rotating content in a 10-second cycle:

1. **Environmental Data** (Index 0)
   - Real-time temperature and pressure simulation
   - Current date and time
   - Professional data visualization

2. **Random Messages** (Index 1)
   - Rotating motivational and informational messages
   - Updates every 30 seconds
   - Company communication display

3. **Custom Scheduled Content** (Index 2)
   - Admin-scheduled notifications
   - Time-based scheduling support
   - Multiple content types (text, images, embeds)

### Content Types Supported

| Type | Description | Max Images |
|------|-------------|------------|
| TEXT | Text-only notifications | 0 |
| IMAGE_SINGLE | Single image display | 1 |
| IMAGE_DUAL | Two-image layout | 2 |
| IMAGE_QUAD | Four-image grid | 4 |
| EMBED | Embedded content (HTML/URLs) | 0 |

### Real-time Features

- **Content Fetching**: Every 5 seconds for new scheduled content
- **Environmental Updates**: Every 1 second for time/sensor data
- **Message Rotation**: Every 30 seconds for random messages
- **Content Cycling**: Every 10 seconds between content types

## 🎨 Styling & Theming

The application uses a modern CSS architecture with:

- **CSS Variables**: Consistent theming and easy customization
- **Responsive Design**: Mobile-first approach with breakpoints
- **Gradient Backgrounds**: Professional visual appeal
- **Animation**: Smooth transitions and loading states
- **Grid/Flexbox**: Modern layout techniques

### Key Style Features
- Collapsible sidebar navigation
- Professional admin dashboard
- TV-optimized display layouts
- Loading spinners and states
- Error message styling

## 🔐 Authentication Flow

1. **Login/Signup**: Users authenticate via forms
2. **Role Detection**: System identifies user role (admin/user)
3. **Route Protection**: Admin panel restricted to admin users
4. **Session Persistence**: User data stored in localStorage
5. **API Authentication**: HTTP Basic auth for backend requests

### User Roles
- **Admin**: Full access to content management and TV displays
- **User**: Limited to TV display viewing

## 📱 Responsive Design

The application is fully responsive with:
- **Desktop**: Full sidebar and navigation
- **Tablet**: Collapsible sidebar
- **Mobile**: Optimized touch interfaces
- **TV Displays**: Full-screen content optimization

## 🐛 Development & Debugging

### Debug Features
- Console logging for content rotation
- API call debugging utilities
- User role debugging functions
- Development-specific test accounts

### Development Tools
- React Developer Tools support
- Hot reloading with Create React App
- Error boundaries for component isolation
- Comprehensive error messaging

## 📊 Performance Optimizations

- **Component Memoization**: Efficient re-rendering
- **Interval Management**: Proper cleanup to prevent memory leaks
- **API Caching**: Intelligent content fetching
- **CSS Optimization**: Minimal bundle size
- **Image Optimization**: Efficient loading strategies

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Configuration
- Backend URL configuration for different environments
- API endpoint management
- Static asset optimization

### Deployment Options
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: CloudFront, CloudFlare
- **Container**: Docker deployment with Nginx

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow React best practices
- Maintain component modularity
- Write comprehensive comments
- Test authentication flows
- Ensure responsive design

## 📜 License

This project is part of a notification management system. Please refer to the main repository for licensing information.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the backend documentation for API-related issues
- Refer to `backend-security-fix.md` for authentication problems

---

