import os
import sys
from pathlib import Path
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Add parent directory to path to import models
sys.path.insert(0, str(Path(__file__).parent.parent))

config = context.config
fileConfig(config.config_file_name)

# Import Base from database to enable autogenerate
from database import Base
import models  # Import models to register them with Base

target_metadata = Base.metadata

def run_migrations_offline():
    url = os.environ.get("DATABASE_URL")
    context.configure(
        url=url, target_metadata=target_metadata, literal_binds=True, compare_type=True
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    # Override the sqlalchemy.url with the one from environment variable
    configuration = config.get_section(config.config_ini_section)
    configuration['sqlalchemy.url'] = os.environ.get("DATABASE_URL")

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
