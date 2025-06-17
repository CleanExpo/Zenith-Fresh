# Zenith Team Management

A modern team management application built with Next.js, Prisma, and PostgreSQL.

## Features

- Team analytics and usage tracking
- Billing and subscription management
- Team settings and configuration
- Integration with popular services (Slack, Discord, GitHub)

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use `.env.example` as a template
   - Rotate credentials regularly
   - Use different credentials for development and production

2. **API Keys and Secrets**
   - Store secrets in a secure vault (e.g., Vercel, Railway, or AWS Secrets Manager)
   - Rotate API keys immediately if compromised
   - Use environment-specific API keys
   - Implement rate limiting for API endpoints

3. **Database Security**
   - Use connection pooling
   - Implement proper access controls
   - Regular backups
   - Encrypt sensitive data

4. **Authentication**
   - Implement MFA where possible
   - Use secure session management
   - Regular security audits
   - Implement proper password policies

## Prerequisites

- Node.js 18 or later
- PostgreSQL 12 or later
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/zenith.git
cd zenith
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the required values
   - Never commit the `.env` file

4. Set up the database:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

- `/src/components` - React components
- `/src/pages` - Next.js pages and API routes
- `/src/lib` - Utility functions and shared code
- `/prisma` - Database schema and migrations

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 

## Applying Prisma Schema

Run the following command to apply your database schema migrations:
```bash
npx prisma migrate deploy
```

This will ensure your production database is up to date with your latest schema.

# Force rebuild
