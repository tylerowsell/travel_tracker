"""Add multi-user collaboration tables

Revision ID: 004
Revises: 003
Create Date: 2025-10-31

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    # User profiles table
    op.create_table(
        'user_profiles',
        sa.Column('id', sa.String(), primary_key=True),  # Supabase user ID
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('display_name', sa.String(), nullable=False),
        sa.Column('avatar_url', sa.String(), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index('ix_user_profiles_email', 'user_profiles', ['email'])

    # Trip members table - links users to trips with roles
    op.create_table(
        'trip_members',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('trip_id', sa.Integer(), sa.ForeignKey('trips.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('user_profiles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default='member'),  # owner, admin, member, viewer
        sa.Column('invite_status', sa.String(), nullable=False, server_default='accepted'),  # pending, accepted, declined
        sa.Column('joined_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_trip_members_trip_id', 'trip_members', ['trip_id'])
    op.create_index('ix_trip_members_user_id', 'trip_members', ['user_id'])
    # Ensure one user can't be added to same trip twice
    op.create_unique_constraint('uq_trip_user', 'trip_members', ['trip_id', 'user_id'])

    # Trip invites table - for shareable invite links
    op.create_table(
        'trip_invites',
        sa.Column('id', sa.String(), primary_key=True),  # UUID
        sa.Column('trip_id', sa.Integer(), sa.ForeignKey('trips.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_by', sa.String(), sa.ForeignKey('user_profiles.id'), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('max_uses', sa.Integer(), nullable=True),  # null = unlimited
        sa.Column('used_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_trip_invites_trip_id', 'trip_invites', ['trip_id'])

    # Activity log table - for real-time feed
    op.create_table(
        'activity_log',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('trip_id', sa.Integer(), sa.ForeignKey('trips.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('user_profiles.id'), nullable=False),
        sa.Column('action_type', sa.String(), nullable=False),  # expense_added, member_joined, etc.
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_activity_log_trip_id', 'activity_log', ['trip_id'])
    op.create_index('ix_activity_log_created_at', 'activity_log', ['created_at'])

    # Comments table - for expense comments
    op.create_table(
        'comments',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('expense_id', sa.Integer(), sa.ForeignKey('expenses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('user_profiles.id'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index('ix_comments_expense_id', 'comments', ['expense_id'])

    # Reactions table - for emoji reactions
    op.create_table(
        'reactions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('expense_id', sa.Integer(), sa.ForeignKey('expenses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('user_profiles.id'), nullable=False),
        sa.Column('emoji', sa.String(10), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_reactions_expense_id', 'reactions', ['expense_id'])
    # One user can only react with same emoji once per expense
    op.create_unique_constraint('uq_user_emoji_expense', 'reactions', ['expense_id', 'user_id', 'emoji'])


def downgrade():
    op.drop_table('reactions')
    op.drop_table('comments')
    op.drop_table('activity_log')
    op.drop_table('trip_invites')
    op.drop_table('trip_members')
    op.drop_table('user_profiles')
