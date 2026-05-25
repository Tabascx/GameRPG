# Proves GraphiQL

URL local:

```txt
http://127.0.0.1:8000/graphql
```

Header admin per provar operacions protegides:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJhZG1pbjEiLCJlbWFpbCI6ImFkbWluQGFzdHJvaHVudGVycy5jb20ifQ.vAtJhHxv2s40JpxC6x35-EtY4hDawdXA1l_dUa3tcTI"
}
```

## 1. Consultar configuracio global

```graphql
query ConfigGlobals {
  configGlobals {
    multiplicadorMillora
    multiplicadorSeguro
    multiplicadorProbabilitat
  }
}
```

## 2. Registrar jugador

```graphql
mutation RegistrarJugador {
  registrarJugador(input: { nickname: "AdminPilot" }) {
    __typename
    ... on Jugador {
      id
      nickname
      nivell
      monedes
      diaActual
      ban
    }
    ... on ErrorNoAutoritzat {
      missatge
    }
  }
}
```

## 3. Perfil de jugador amb inventari

```graphql
query PerfilJugador {
  perfilJugador(id: "admin1") {
    id
    nickname
    nivell
    monedes
    diaActual
    ban
    millores {
      id
      nom
      descripcio
      nivell
    }
    inventari {
      id
      itemId
      nomItem
      raresa
    }
  }
}
```

## 4. Donar item amb codi de 3 digits

```graphql
mutation GiveItem {
  giveItem(
    input: {
      jugadorId: "admin1"
      itemId: "001"
      nomItem: "Pistola Laser"
      raresa: "Epic"
    }
  ) {
    __typename
    ... on Item {
      id
      itemId
      nomItem
      raresa
    }
    ... on ErrorJugadorNoTrobat {
      missatge
    }
    ... on ErrorJugadorBan {
      missatge
    }
    ... on ErrorItemInvalid {
      missatge
    }
  }
}
```

## 5. Validar error de codi d'item

```graphql
mutation GiveItemInvalid {
  giveItem(
    input: {
      jugadorId: "admin1"
      itemId: "laser_pistol"
      nomItem: "Pistola Laser"
      raresa: "Epic"
    }
  ) {
    __typename
    ... on Item {
      id
      itemId
    }
    ... on ErrorItemInvalid {
      missatge
    }
  }
}
```

## 6. Pujar nivell com admin

```graphql
mutation PujarNivell {
  pujarNivell(input: { jugadorId: "admin1" }) {
    __typename
    ... on Jugador {
      id
      nickname
      nivell
    }
    ... on ErrorNoAutoritzat {
      missatge
    }
    ... on ErrorJugadorNoTrobat {
      missatge
    }
  }
}
```

## 7. Crear partida

Guarda l'`id` retornat per usar-lo a les proves 8 i 9.

```graphql
mutation CrearPartida {
  crearPartida(input: { jugadorId: "admin1", dia: 1 }) {
    id
    jugadorId
    mapa
    estat
    dia
    dataCreacio
  }
}
```

## 8. Registrar puntuacio

Substitueix `PEGA_ID_PARTIDA` per l'`id` retornat a la prova 7.

```graphql
mutation RegistrarPuntuacio {
  registrarPuntuacio(
    input: {
      partidaId: "PEGA_ID_PARTIDA"
      jugadorId: "admin1"
      punts: 1500
      baixes: 12
    }
  ) {
    __typename
    ... on ResultatJoc {
      id
      jugadorId
      punts
      baixes
    }
    ... on ErrorPartidaNoTrobada {
      missatge
    }
    ... on ErrorJugadorNoTrobat {
      missatge
    }
  }
}
```

## 9. Classificacio amb relacio inversa jugador

Substitueix `PEGA_ID_PARTIDA` per l'`id` retornat a la prova 7.

```graphql
query TaulaClassificacio {
  taulaClassificacio(idPartida: "PEGA_ID_PARTIDA") {
    id
    jugadorId
    punts
    baixes
    jugador {
      id
      nickname
      nivell
    }
  }
}
```

## 10. Llistar partides amb filtres i paginacio

```graphql
query LlistarPartides {
  llistarPartides(estat: "En curs", limit: 5, offset: 0) {
    id
    jugadorId
    mapa
    estat
    dia
    dataCreacio
  }
}
```

## 11. Actualitzar configuracio global com admin

```graphql
mutation ActualitzarConfigGlobals {
  actualitzarConfigGlobals(
    input: {
      multiplicadorMillora: 1.2
      multiplicadorSeguro: 1.0
      multiplicadorProbabilitat: 0.95
    }
  ) {
    __typename
    ... on ConfigGlobals {
      multiplicadorMillora
      multiplicadorSeguro
      multiplicadorProbabilitat
    }
    ... on ErrorConfigNoAutoritzat {
      missatge
    }
  }
}
```
