# With Docker
- Configure the Environment Variables on docker-compose.yaml
- docker compose up

# Without Docker
- cp .env.example .env
- Configure the Environment Variables
- npm install
- npx prisma generate
- npm run build
- npm run start
