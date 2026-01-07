"""Add monto_inicial column to contratos table

Revision ID: add_monto_inicial
Revises: 
Create Date: 2026-01-07

"""
from alembic import op
import sqlalchemy as sa


def upgrade():
    # Agregar la columna monto_inicial después de monto_total
    op.add_column('contratos', sa.Column('monto_inicial', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'))


def downgrade():
    # Remover la columna en caso de rollback
    op.drop_column('contratos', 'monto_inicial')
