# Frontend (Next.js 15)

This is the frontend application for the project, built with Next.js 15, TypeScript, Tailwind CSS, and the App Router.

## Project Structure

```
frontend/
└── src/
    ├── app/         # App Router directory (pages, layouts, entry points)
    ├── components/  # Reusable React components
    ├── context/     # React context providers for state management
    ├── hooks/       # Custom React hooks
    ├── lib/         # Shared libraries, API clients, utilities
    ├── styles/      # Modular and reusable CSS/SCSS files
    ├── types/       # Shared TypeScript type definitions
    └── utils/       # Utility/helper functions
```

- **app/**: Contains the main routing and layout logic using Next.js App Router.
- **components/**: Place for all reusable UI components.
- **context/**: For React context providers (global state, themes, etc.).
- **hooks/**: Custom hooks for encapsulating logic.
- **lib/**: Shared libraries, API clients, and logic used across the app.
- **styles/**: Modular CSS/SCSS files (global styles are in `app/globals.css`).
- **types/**: TypeScript type definitions shared across the app.
- **utils/**: Utility/helper functions.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) to view the app.

---

For more details, see the [Next.js documentation](https://nextjs.org/docs).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
