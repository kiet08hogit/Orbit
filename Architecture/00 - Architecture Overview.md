# Circlo - Architecture Overview

## Product Summary

Circlo is a verified marketplace and community platform for UIC students.

Core features:
- Buy and sell items
- Offer services such as tutoring, rentals, and quick help
- Community feed for posts, questions, and offers
- Tinder-style swipe discovery for listings
- Real-time chat between students

---

## Initial User Scale

The first release is designed for approximately:

- 20–50 UIC students
- Single-region deployment
- Simple, maintainable architecture
- Room to scale later if usage grows

---

## High-Level System Architecture

The system contains:

### Frontend
- Next.js + TypeScript
- Hosted on Azure Static Web Apps
- Handles page rendering, UI, client-side interactions, and requests to the backend

### Backend
- TypeScript backend API
- Hosted on Azure App Service
- Handles:
  - REST API requests
  - Authentication middleware
  - Business logic
  - WebSocket connections for real-time chat

### Authentication
- Clerk for user sign-in and session management
- Backend verifies Clerk JWTs
- Users must have a `@uic.edu` email

### Database
- Azure Database for PostgreSQL
- Stores:
  - Users
  - Listings
  - Posts
  - Interactions
  - Conversations
  - Messages

### File Storage
- Azure Blob Storage
- Stores listing images and future uploaded files

### Optional Future Cache
- Azure Redis can be added later if read traffic grows
- Possible cache targets:
  - Popular listings
  - Feed results
  - Search results

---

## Main Request Flow

General application flow:

1. User opens Circlo in the browser
2. Frontend loads from Azure Static Web Apps
3. Frontend sends REST or WebSocket requests to backend
4. Backend verifies the user through Clerk JWT validation
5. Backend executes business logic
6. Data is read from or written to PostgreSQL
7. Images are stored in Azure Blob Storage when needed

---

## Architecture Diagrams

- High-Level System Design Architecture
- Backend Component Architecture
- Relational Database Design
- Core Request Flows