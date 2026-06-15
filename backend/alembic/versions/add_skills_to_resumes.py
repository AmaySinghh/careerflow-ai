"""add skills to resumes

Revision ID: a1b2c3d4e5f6
Revises: 81aacfb75a4a
Create Date: 2026-06-15

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

revision = 'a1b2c3d4e5f6'
down_revision = '81aacfb75a4a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('resumes', sa.Column('skills', JSON, nullable=True))


def downgrade() -> None:
    op.drop_column('resumes', 'skills')