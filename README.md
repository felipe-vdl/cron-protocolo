# With Docker
- cp .env.example .env
- Configure the Environment Variables
- docker compose up

# Without Docker
- cp .env.example .env
- Configure the Environment Variables
- npm install
- npx prisma generate
- npm run build
- npm run start
