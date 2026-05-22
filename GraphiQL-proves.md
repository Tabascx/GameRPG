# Proves GraphiQL

Header HTTP per a mutacions protegides:

```json
{
  "Authorization": "Bearer <TOKEN_JWT>"
}
```

## 1. Registrar jugador

```graphql
mutation RegistrarJugador {
  registrarJugador(input: { nickname: "PilotNexus" }) {
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

## 2. Perfil de jugador amb inventari

```graphql
query PerfilJugador {
  perfilJugador(id: "jugador1") {
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

## 3. Llistar partides amb filtres i paginacio

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

## 4. Classificacio amb relacio inversa jugador

```graphql
query TaulaClassificacio {
  taulaClassificacio(idPartida: "partida1") {
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

## 5. Donar item a un jugador

```graphql
mutation GiveItem {
  giveItem(
    input: {
      jugadorId: "jugador1"
      itemId: "laser_pistol"
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
  }
}
```

## 6. Pujar nivell com admin

```graphql
mutation PujarNivell {
  pujarNivell(input: { jugadorId: "jugador1" }) {
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

## 7. Registrar puntuacio

```graphql
mutation RegistrarPuntuacio {
  registrarPuntuacio(
    input: {
      partidaId: "partida1"
      jugadorId: "jugador1"
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
  }
}
```

## 8. Consultar configuracio global

```graphql
query ConfigGlobals {
  configGlobals {
    multiplicadorMillora
    multiplicadorSeguro
    multiplicadorProbabilitat
  }
}
```

## 9. Actualitzar configuracio global com admin

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
