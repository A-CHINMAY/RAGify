# URL Shortener

A full-stack web application that allows users to shorten long URLs into compact, shareable links with click tracking and statistics.

## Technologies Used

### Backend:
- **Node.js** - JavaScript runtime
- **Express** - Web framework for Node.js
- **MongoDB** - NoSQL database for storing URLs and statistics
- **CORS** - Cross-Origin Resource Sharing middleware
- **dotenv** - Environment variables management

### Frontend:
- **HTML5** - Semantic markup
- **CSS3** - Custom styling
- **JavaScript** - Client-side interactions
- **Chart.js** - For displaying statistics graphs

## Features
- Shorten long URLs to compact, easy-to-share links
- Copy shortened URLs to clipboard with one click
- Track statistics for each shortened URL:
  - Total clicks
  - Visitor countries
  - Daily click distribution
- Responsive design for mobile and desktop

## Setup and Installation

### Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)

### Installation Steps
1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/url-shortener.git
   cd url-shortener
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Create a `.env` file** in the root directory with the following variables:
   ```sh
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/url-shortener
   CLIENT_URL=http://localhost:3000
   BASE_URL=http://localhost:3000
   ```

4. **Start the server:**
   ```sh
   npm start
   ```

5. **Open your browser and navigate to:**
   ```sh
   http://localhost:3000
   ```

## Development

### Install Node.js and Initialize Project
```sh
npm init -y
```

### Install Express
```sh
npm install express
```

### Install Required Dependencies
```sh
npm install axios cors dotenv express mongoose valid-url
```

### Install Dev Dependencies
```sh
npm install nodemon --save-dev
```

### Start Backend Server
```sh
npm start  # or
nodemon server.js
```

## Deployment
This application can be deployed to platforms like **Vercel, Heroku**, or any other Node.js hosting service. Make sure to update the environment variables according to your 
