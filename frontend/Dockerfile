FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source
COPY . .

# Build
ENV NEXT_PUBLIC_API_URL=/api/v1
RUN npm run build

# Start
CMD ["npm", "start"]
