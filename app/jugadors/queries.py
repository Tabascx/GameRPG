import strawberry
from app.firebase_conf import db
from app.jugadors.types import Jugador, InventariItem


@strawberry.type
class JugadorsQuery:
    @strawberry.field
    def perfil_jugador(self, id: str) -> Jugador | None:
        doc = db.collection("jugadors").document(id).get()
        if not doc.exists:
            return None
        data = doc.to_dict()

        # Cargar subcol·lecció inventari
        items_ref = db.collection("jugadors").document(id).collection("inventari").stream()
        inventari = [
            InventariItem(id=i.id, **i.to_dict()) for i in items_ref
        ]
        return Jugador(id=doc.id, inventari=inventari, **data)