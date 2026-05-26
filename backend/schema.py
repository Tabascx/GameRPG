import strawberry
from backend.jugadors.queries import JugadorsQuery
from backend.jugadors.mutations import JugadorsMutation
from backend.partides.queries import PartidesQuery
from backend.partides.mutations import PartidesMutation
from backend.config.queries import ConfigQuery
from backend.config.mutations import ConfigMutation
from backend.admin.mutations import AdminMutation
from backend.usuaris.mutations import UsuarisMutation

@strawberry.type
class Query(JugadorsQuery, PartidesQuery, ConfigQuery):
    pass

@strawberry.type
class Mutation(JugadorsMutation, PartidesMutation, ConfigMutation, AdminMutation, UsuarisMutation):
    pass

schema = strawberry.Schema(query=Query, mutation=Mutation)
