import strawberry
from typing import Union
from strawberry.types import Info
from backend.auth import is_admin
from backend.config.service import update_config_globals_data
from backend.config.types import (
    ActualitzarConfigGlobalsInput,
    ConfigGlobals,
    ErrorConfigNoAutoritzat,
)

@strawberry.type
class ConfigMutation:
    @strawberry.mutation
    def actualitzar_config_globals(
        self,
        input: ActualitzarConfigGlobalsInput,
        info: Info
    ) -> Union[ConfigGlobals, ErrorConfigNoAutoritzat]:
        try:
            admin = is_admin(info)
        except Exception:
            admin = False

        if not admin:
            return ErrorConfigNoAutoritzat(missatge="Nomes un admin pot actualitzar la configuracio global")

        data = update_config_globals_data({
            "multiplicador_millora": input.multiplicador_millora,
            "multiplicador_seguro": input.multiplicador_seguro,
            "multiplicador_probabilitat": input.multiplicador_probabilitat,
        })
        return ConfigGlobals(**data)
