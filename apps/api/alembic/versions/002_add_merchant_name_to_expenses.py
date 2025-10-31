"""Add merchant_name to expenses

Revision ID: 002
Revises: 001
Create Date: 2025-10-31

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    # Add merchant_name column to expenses table
    op.add_column('expenses', sa.Column('merchant_name', sa.String(), nullable=True))


def downgrade():
    # Remove merchant_name column from expenses table
    op.drop_column('expenses', 'merchant_name')
