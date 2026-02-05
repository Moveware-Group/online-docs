# Moveware Next.js Application

Modern web application built with Next.js 14, TypeScript, and Tailwind CSS, integrating with Moveware API.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Moveware API credentials:

```env
MOVEWARE_API_URL=https://api.moveware.example.com
MOVEWARE_API_KEY=your_api_key_here
MOVEWARE_API_VERSION=v1
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:

```bash
npm run build
# or
yarn build
```

### Start Production Server

```bash
npm start
# or
yarn start
```

## Project Structure

```
├── app/                    # Next.js app router directory
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── lib/                   # Utility functions and configurations
│   └── config.ts          # Environment configuration
├── public/                # Static assets
├── .env.example           # Environment variables template
├── next.config.js         # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Environment Variables

### Required

- `MOVEWARE_API_URL` - Moveware API base URL
- `MOVEWARE_API_KEY` - API authentication key

### Optional

- `MOVEWARE_API_VERSION` - API version (default: v1)
- `NEXT_PUBLIC_APP_NAME` - Application name
- `NEXT_PUBLIC_APP_URL` - Application URL

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **API Integration:** Moveware API

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
