import strawberry
from backend.firebase_conf import db
from backend.jugadors.types import Jugador, Millora, Item, normalitzar_jugador_data

@strawberry.type
class JugadorsQuery:
    @strawberry.field
    def perfil_jugador(self, id: str) -> Jugador | None:
        doc = db.collection("jugadors").document(id).get()
        if not doc.exists:
            return None
        data = normalitzar_jugador_data(doc.to_dict())

        millores = []
        inventari = []
        for m in db.collection("jugadors").document(id).collection("inventari").stream():
            item_data = m.to_dict()
            if "nom" in item_data:
                millores.append(Millora(id=m.id, **item_data))
            if "nom_item" in item_data:
                item_data.setdefault("item_id", m.id)
                inventari.append(Item(id=m.id, **item_data))
        return Jugador(id=doc.id, millores=millores, inventari=inventari, **data)

    @strawberry.field
    def leaderboard(self) -> list[Jugador]:
        docs = db.collection("jugadors").order_by("monedes", direction="DESCENDING").limit(10).stream()
        result = []
        for doc in docs:
            data = normalitzar_jugador_data(doc.to_dict())
            millores = []
            inventari = []
            for m in db.collection("jugadors").document(doc.id).collection("inventari").stream():
                item_data = m.to_dict()
                if "nom" in item_data:
                    millores.append(Millora(id=m.id, **item_data))
                if "nom_item" in item_data:
                    item_data.setdefault("item_id", m.id)
                    inventari.append(Item(id=m.id, **item_data))
            result.append(Jugador(id=doc.id, millores=millores, inventari=inventari, **data))
        return result
