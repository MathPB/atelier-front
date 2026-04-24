FROM nginx:1.27-alpine

# Copia a configuração personalizada do Nginx para SPA (fallback para index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Os arquivos estáticos gerados pelo Vite (pasta dist/) serão copiados pelo pipeline
COPY dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
