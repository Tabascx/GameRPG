import { gql } from '@apollo/client';

export const GET_PERFIL = gql`
  query GetPerfil($id: String!) {
    perfilJugador(id: $id) {
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
`;

export const GET_LEADERBOARD = gql`
  query {
    leaderboard {
      id
      nickname
      nivell
      monedes
      diaActual
      ban
    }
  }
`;

export const GET_CONFIG_GLOBALS = gql`
  query GetConfigGlobals {
    configGlobals {
      multiplicadorMillora
      multiplicadorSeguro
      multiplicadorProbabilitat
    }
  }
`;

export const REGISTRAR_JUGADOR = gql`
  mutation RegistrarJugador($nickname: String!) {
    registrarJugador(input: { nickname: $nickname }) {
      __typename
      ... on Jugador {
        id
        nickname
        nivell
        monedes
        diaActual
      }
      ... on ErrorNoAutoritzat {
        missatge
      }
    }
  }
`;

export const COMPRAR_MILLORA = gql`
  mutation ComprarMillora($jugadorId: String!, $nom: String!, $descripcio: String!) {
    comprarMillora(input: { jugadorId: $jugadorId, nom: $nom, descripcio: $descripcio }) {
      ... on Millora {
        id
        nom
        nivell
      }
      ... on ErrorSenseMonedes {
        missatge
      }
      ... on ErrorJugadorBan {
        missatge
      }
      ... on ErrorJugadorNoTrobat {
        missatge
      }
    }
  }
`;

export const CREAR_PARTIDA = gql`
  mutation CrearPartida($jugadorId: String!, $dia: Int!) {
    crearPartida(input: { jugadorId: $jugadorId, dia: $dia }) {
      id
      mapa
      estat
      dia
    }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      __typename
      ... on Token {
        token
        uid
      }
      ... on ErrorLogin {
        missatge
      }
    }
  }
`;

export const REGISTRE = gql`
  mutation Registre($nickname: String!, $email: String!, $password: String!) {
    registre(input: { nickname: $nickname, email: $email, password: $password }) {
      __typename
      ... on Token {
        token
        uid
      }
      ... on ErrorRegistre {
        missatge
      }
    }
  }
`;

export const NETEGAR_BASE_DADES = gql`
  mutation NetejarBaseDades($password: String!) {
    netejarBaseDades(password: $password) {
      __typename
      ... on ResultatNeteja {
        missatge
        documentsEliminats
      }
      ... on ErrorPasswordIncorrecte {
        missatge
      }
    }
  }
`;

export const SINCRONITZAR_JUGADOR = gql`
  mutation SincronitzarJugador($jugadorId: String!, $monedes: Float!, $diaActual: Int!, $millores: [MilloraSyncInput!]!) {
    sincronitzarJugador(input: { jugadorId: $jugadorId, monedes: $monedes, diaActual: $diaActual, millores: $millores }) {
      __typename
      ... on ResultatSincronitzar {
        missatge
        monedes
        diaActual
      }
      ... on ErrorJugadorNoTrobat {
        missatge
      }
    }
  }
`;
