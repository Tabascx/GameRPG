import strawberry
from backend.config.service import get_config_globals_data
from backend.config.types import ConfigGlobals

@strawberry.type
class ConfigQuery:
    @strawberry.field
    def config_globals(self) -> ConfigGlobals:
        return ConfigGlobals(**get_config_globals_data())
