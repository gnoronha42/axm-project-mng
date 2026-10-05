FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/axm-config.js.template /etc/nginx/templates/axm-config.js.template
COPY landing /usr/share/nginx/html
COPY --from=build /app/dist /usr/share/nginx/html/app
ENV NGINX_ENVSUBST_OUTPUT_DIR=/usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
