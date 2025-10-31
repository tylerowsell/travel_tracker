"""Add location fields and receipt_urls to expenses

Revision ID: 003
Revises: 002
Create Date: 2025-10-31

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    # Add location and receipt fields to expenses table
    op.add_column('expenses', sa.Column('receipt_urls', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('expenses', sa.Column('location_text', sa.String(), nullable=True))
    op.add_column('expenses', sa.Column('lat', sa.Float(), nullable=True))
    op.add_column('expenses', sa.Column('lng', sa.Float(), nullable=True))


def downgrade():
    # Remove location and receipt fields from expenses table
    op.drop_column('expenses', 'lng')
    op.drop_column('expenses', 'lat')
    op.drop_column('expenses', 'location_text')
    op.drop_column('expenses', 'receipt_urls')
