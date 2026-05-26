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
