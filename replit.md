# Siraha Bazaar - Multi-Vendor E-commerce Platform

## Overview

Siraha Bazaar is a comprehensive multi-vendor e-commerce marketplace built with modern web technologies. The platform enables multiple vendors to sell products through a unified marketplace while providing customers with a seamless shopping experience. The system includes real-time order tracking, delivery management, and comprehensive admin controls.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Shadcn/UI components with Radix UI primitives
- **Styling**: Tailwind CSS for responsive design
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for fast development and optimized builds
- **Maps Integration**: HERE Maps API for location services and delivery tracking

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for API endpoints
- **Database**: PostgreSQL hosted on Neon
- **ORM**: Drizzle ORM for type-safe database operations
- **Real-time Communication**: WebSocket for live tracking and notifications
- **Authentication**: JWT-based authentication with bcrypt password hashing

### Database Design
- **Primary Database**: PostgreSQL with comprehensive schema
- **Migration System**: Drizzle Kit for schema migrations
- **Connection Pooling**: pg Pool for efficient database connections

## Key Components

### User Management System
- **Multi-role Support**: Customers, shopkeepers, delivery partners, and administrators
- **User Authentication**: Secure registration and login with email verification
- **Role-based Access Control**: Different permissions for each user type
- **User Approval Workflow**: Admin approval required for vendor accounts

### Store Management
- **Multi-vendor Support**: Each shopkeeper can manage their own store
- **Store Analytics**: Comprehensive analytics for store performance
- **Inventory Management**: Stock tracking with automated alerts
- **Product Catalog**: Rich product information with images and categories

### Order Processing System
- **Shopping Cart**: Persistent cart across sessions
- **Order Placement**: Multi-vendor order support with automatic splitting
- **Order Tracking**: Real-time status updates from placement to delivery
- **Payment Integration**: Multiple payment method support

### Real-Time Delivery Tracking
- **HERE Maps Integration**: Route calculation and optimization
- **Live Location Tracking**: Real-time GPS tracking of delivery partners
- **WebSocket Communication**: Live updates to customers and vendors
- **ETA Calculations**: Dynamic delivery time estimates based on traffic

### Admin Dashboard
- **User Management**: Approve/reject vendor applications
- **Order Oversight**: Monitor all orders across the platform
- **Analytics**: Platform-wide performance metrics
- **System Configuration**: Delivery zones, fees, and platform settings

## Data Flow

### Order Processing Flow
1. Customer adds products to cart from multiple stores
2. System calculates delivery fees based on distance and zones
3. Order is placed and automatically split by vendor
4. Notifications sent to relevant store owners
5. Store owners process and fulfill their portion
6. Delivery partner is assigned for pickup and delivery
7. Real-time tracking begins with WebSocket connections
8. Status updates broadcast to all stakeholders

### Real-Time Tracking Flow
1. Delivery partner accepts order assignment
2. HERE Maps calculates optimal route
3. Partner shares live location via mobile GPS
4. Location updates stored in database
5. WebSocket broadcasts updates to customers
6. ETA recalculated based on current location and traffic
7. Status updates trigger notifications to all parties

## External Dependencies

### HERE Maps API
- **Purpose**: Location services, routing, and mapping
- **Usage**: Route calculation, geocoding, and map display
- **Fallback**: Google Maps integration for backup routing

### Payment Processing
- **Stripe Integration**: Primary payment processor
- **PayPal SDK**: Alternative payment method
- **Security**: PCI compliance through third-party processors

### Email Services
- **SendGrid**: Transactional email delivery
- **Use Cases**: Order confirmations, user notifications, admin alerts

### Database Hosting
- **Neon PostgreSQL**: Cloud-hosted database with auto-scaling
- **Connection**: SSL-secured with connection pooling

## Deployment Strategy

### Development Environment
- **Platform**: Replit for development and testing
- **Hot Reload**: Vite HMR for rapid development
- **Database**: Direct connection to Neon PostgreSQL

### Production Deployment
- **Build Process**: Vite builds frontend, esbuild bundles backend
- **Static Assets**: Served through Express static middleware
- **Process Management**: Node.js process with proper error handling
- **Environment Configuration**: Environment variables for sensitive data

### Database Management
- **Migrations**: Automated through Drizzle Kit
- **Backups**: Handled by Neon PostgreSQL service
- **Scaling**: Auto-scaling database connections

## Changelog
- June 13, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.