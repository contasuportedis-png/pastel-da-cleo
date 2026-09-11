# 🥟 Pastel da Cléo — site + backend

## Rodar (recomendado — vale para todos os aparelhos)

```bash
npm start
# ou: PORT=3000 node server.mjs
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin → **crie a senha no primeiro acesso** (não há senha padrão)
- Dados: `data/cleo.db` (SQLite, criado sozinho com cardápio inicial)

Na rede local, outros aparelhos acessam via `http://IP-DO-PC:3000`.

## Sem servidor (só visualização local)

Abrir `index.html` direto no navegador também funciona — nesse modo cada
aparelho tem seus próprios dados (nada sincroniza).

## Produção

Coloque atrás de HTTPS (Nginx/Caddy como proxy reverso) e faça backup de
`data/cleo.db`. Não há dado de cartão: pagamento é só seleção (Pix/dinheiro/cartão).
