import strawberry
from app.firebase_conf import db
from app.auth import get_current_user, is_admin
from app.jugadors.types import Jugador, InventariItem, RegistrarJugadorInput, AtorgarItemInput, ErrorJugadorBanejat
from strawberry.types import Info

@strawberry.type
class JugadorsMutation:
    @strawberry.mutation
    def registrar_jugador(self, input: RegistrarJugadorInput, info: Info) -> Jugador:
        user = get_current_user(info)
        uid = user["uid"]
        data = {"nickname": input.nickname, "nivell": 1, "banejat": False}
        db.collection("jugadors").document(uid).set(data)
        return Jugador(id=uid, inventari=[], **data)

    @strawberry.mutation
    def atorgar_item(self, input: AtorgarItemInput, info: Info) -> InventariItem:
        data = {"nom_item": input.nom_item, "raresa": input.raresa}
        ref = db.collection("jugadors").document(input.jugador_id).collection("inventari").add(data)
        return InventariItem(id=ref[1].id, **data)

    @strawberry.mutation
    def pujar_nivell(self, jugador_id: str, info: Info) -> Jugador | str:
        if not is_admin(info):
            return "Accés denegat: calen permisos d'Admin"
        ref = db.collection("jugadors").document(jugador_id)
        ref.update({"nivell": firestore.Increment(1)})
        doc = ref.get()
        return Jugador(id=doc.id, inventari=[], **doc.to_dict())