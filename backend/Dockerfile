FROM node:22-alpine
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY backend/src ./src
COPY backend/tests ./tests
COPY banco-de-dados/18_correcao_imagens_ia.sql /app/banco-de-dados/18_correcao_imagens_ia.sql
COPY banco-de-dados/19_variacoes_automaticas_ia.sql /app/banco-de-dados/19_variacoes_automaticas_ia.sql
COPY banco-de-dados/20_categorias_correcao_v13.sql /app/banco-de-dados/20_categorias_correcao_v13.sql
COPY banco-de-dados/21_referencias_multiplas_produto_ia.sql /app/banco-de-dados/21_referencias_multiplas_produto_ia.sql
COPY compose.yaml /app/compose.yaml
COPY site /app/site
RUN mkdir -p uploads/modelos uploads/geradas
ENV PORT=3000
EXPOSE 3000
CMD ["node", "src/server.js"]
