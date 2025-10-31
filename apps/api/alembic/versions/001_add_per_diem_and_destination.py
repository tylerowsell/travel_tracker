"""Add per_diem_budget and destination to trips

Revision ID: 001
Revises:
Create Date: 2025-10-31

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add per_diem_budget column to trips table
    op.add_column('trips', sa.Column('per_diem_budget', sa.Numeric(precision=12, scale=2), nullable=True))

    # Add destination column to trips table
    op.add_column('trips', sa.Column('destination', sa.String(), nullable=True))


def downgrade():
    # Remove destination column from trips table
    op.drop_column('trips', 'destination')

    # Remove per_diem_budget column from trips table
    op.drop_column('trips', 'per_diem_budget')
