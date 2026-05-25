import { gql } from '@apollo/client';

export const GET_PERFIL = gql`
  query GetPerfil($id: String!) {
    perfilJugador(id: $id) {
      id
      nickname
      monedes
      diaActual
      millores {
        id
        nom
        descripcio
        nivell
      }
    }
  }
`;

export const GET_LEADERBOARD = gql`
  query {
    leaderboard {
      id
      nickname
      monedes
      diaActual
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
