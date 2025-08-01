"""Initial migration

Revision ID: d5cdcf596108
Revises: 
Create Date: 2025-07-29 15:03:46.003078

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd5cdcf596108'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('users',
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('first_name', sa.String(length=50), nullable=False),
    sa.Column('last_name', sa.String(length=50), nullable=False),
    sa.Column('age', sa.Integer(), nullable=False),
    sa.Column('date_of_birth', sa.Date(), nullable=False),
    sa.Column('nationality', sa.String(length=50), nullable=False),
    sa.Column('email', sa.String(length=120), nullable=False),
    sa.Column('phone_number', sa.String(length=20), nullable=False),
    sa.Column('favorite_team', sa.String(length=100), nullable=False),
    sa.Column('favorite_player', sa.String(length=100), nullable=False),
    sa.Column('profile_picture', sa.LargeBinary(), nullable=True),
    sa.PrimaryKeyConstraint('user_id'),
    sa.UniqueConstraint('email')
    )
    op.create_table('trips',
    sa.Column('trip_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('country', sa.String(length=50), nullable=False),
    sa.Column('city', sa.String(length=50), nullable=False),
    sa.Column('stadium', sa.String(length=100), nullable=False),
    sa.Column('start_date', sa.Date(), nullable=False),
    sa.Column('end_date', sa.Date(), nullable=False),
    sa.Column('note', sa.Text(), nullable=False),
    sa.Column('photo', sa.LargeBinary(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
    sa.PrimaryKeyConstraint('trip_id')
    )
    op.create_table('matches',
    sa.Column('match_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('trip_id', sa.Integer(), nullable=False),
    sa.Column('home_team', sa.String(length=100), nullable=False),
    sa.Column('away_team', sa.String(length=100), nullable=False),
    sa.Column('home_team_scorer', sa.Text(), nullable=False),
    sa.Column('away_team_scorer', sa.Text(), nullable=False),
    sa.Column('mvp', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('photo1', sa.LargeBinary(), nullable=True),
    sa.Column('photo2', sa.LargeBinary(), nullable=True),
    sa.Column('photo3', sa.LargeBinary(), nullable=True),
    sa.ForeignKeyConstraint(['trip_id'], ['trips.trip_id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
    sa.PrimaryKeyConstraint('match_id'),
    sa.UniqueConstraint('trip_id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('matches')
    op.drop_table('trips')
    op.drop_table('users')
    # ### end Alembic commands ###
