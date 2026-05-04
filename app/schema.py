import strawberry
from app.jugadors.queries import JugadorsQuery
from app.jugadors.mutations import JugadorsMutation
from app.partides.queries import PartidesQuery
from app.partides.mutations import PartidesMutation

@strawberry.type
class Query(JugadorsQuery, PartidesQuery):
    pass

@strawberry.type
class Mutation(JugadorsMutation, PartidesMutation):
    pass

schema = strawberry.Schema(query=Query, mutation=Mutation)