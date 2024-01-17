FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
EXPOSE 4173

# docker build -t lobster-frontend .
# docker run --name lobster-frontend -dp 127.0.0.1:4173:4173 lobster-frontend
# docker start lobster-frontend
