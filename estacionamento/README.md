# Estacionamento

Sistema de controle de estacionamento (Desenvolvimento Web III, 1º trabalho).
Registra o veículo (placa, marca, modelo e dono), o horário de entrada e o horário de saída.

## Arquitetura

Cliente e servidor em portas separadas:

| Serviço  | Tecnologia                         | Porta       |
|----------|------------------------------------|-------------|
| frontend | Node, Express, Nunjucks, Bootstrap | 41100       |
| backend  | Node, Express, JWT                 | 41000       |
| db       | PostgreSQL                         | 5433 (host) |

O front-end nunca acessa o banco. Ele só conversa com as APIs do backend, enviando o JWT guardado no localStorage.

## Tabelas (relação 1:N)

* `veiculos`: veiculoid, placa (texto), marca, modelo, dono, removido
* `registros`: registroid, veiculoid (FK), horaentrada (data/hora), horasaida (data/hora), valor (decimal), removido

Todas têm `ID` e `removido`. A exclusão é lógica (soft delete): o registro continua no banco com `removido = true`.

## Como rodar com Docker

```
docker compose up --build
```

Acesse http://localhost:41100 e entre com **admin / admin123**.
As tabelas, o usuário e alguns veículos de exemplo são criados automaticamente na primeira execução.
Para recriar o banco do zero: `docker compose down -v`.

## Como rodar sem Docker (apenas o banco no Docker)

```
docker compose up -d db

cd estacionamentobackend
cp .env.example .env
npm install
npm start

cd ../estacionamentofrontend
npm install
npm start
```

## APIs do backend

Todas exigem `Authorization: Bearer <token>`, exceto o login.

| Método | Rota                         | Descrição                             |
|--------|------------------------------|---------------------------------------|
| POST   | /Login                       | Gera o JWT                            |
| GET    | /getAllVeiculos              | Lista os veículos não removidos       |
| GET    | /getVeiculoByID/:veiculoid   | Busca um veículo                      |
| POST   | /insertVeiculo               | Insere um veículo                     |
| PUT    | /updateVeiculo/:veiculoid    | Atualiza um veículo                   |
| DELETE | /deleteVeiculo/:veiculoid    | Soft delete do veículo e dos seus registros |
| GET    | /getAllRegistros             | Lista os registros não removidos      |
| GET    | /getRegistroByID/:registroid | Busca um registro                     |
| POST   | /insertRegistro              | Registra a entrada                    |
| PUT    | /updateRegistro/:registroid  | Atualiza um registro                  |
| DELETE | /deleteRegistro/:registroid  | Soft delete do registro               |
| PUT    | /registrarSaida/:registroid  | Marca a saída agora e calcula o valor |

Exemplos prontos para o REST Client do VS Code estão em `apps/*/tests/*.rest`.

## Regras de negócio

* A placa é validada (ABC1234 ou ABC1D23) e não pode se repetir entre veículos ativos. Marca, modelo e dono são obrigatórios.
* Os erros de validação voltam do backend em `erros` (`{ campo: mensagem }`) e o front-end destaca cada campo em vermelho com a mensagem logo abaixo.
* Um veículo não pode ter duas entradas abertas ao mesmo tempo.
* A saída normal do carro é feita pelo botão **Saída** (listas de Veículos e de Entradas e saídas): ela guarda o horário e o valor no histórico.
* O botão **Excluir** é só para lançamentos feitos por engano: o veículo (ou o lançamento) e suas entradas/saídas deixam de aparecer nas listas (soft delete). Funciona mesmo com o carro no pátio.
* A saída não pode ser anterior à entrada.
* Ao registrar a saída, o valor é calculado por hora iniciada (mínimo de 1 hora) vezes a tarifa `TARIFA_HORA` (padrão R$ 8,00).
