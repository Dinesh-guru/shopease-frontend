# Stage 1: Build the React app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:stable-alpine
# Copy the build output to the Nginx html folder
COPY --from=build /app/dist /usr/share/nginx/html
# (Note: use /app/build if you are using Create React App instead of Vite)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]