import strawberry
from backend.jugadors.queries import JugadorsQuery
from backend.jugadors.mutations import JugadorsMutation
from backend.partides.queries import PartidesQuery
from backend.partides.mutations import PartidesMutation

@strawberry.type
class Query(JugadorsQuery, PartidesQuery):
    pass

@strawberry.type
class Mutation(JugadorsMutation, PartidesMutation):
    pass

schema = strawberry.Schema(query=Query, mutation=Mutation)