"""initial tables

Revision ID: 0001
Revises:
Create Date: 2026-11-01
"""
import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("username", sa.String(50), nullable=False, unique=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("city", sa.String(100)),
        sa.Column("about", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "walks",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("address", sa.String(255), nullable=False),
        sa.Column("latitude", sa.Float, nullable=False),
        sa.Column("longitude", sa.Float, nullable=False),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("max_participants", sa.Integer, nullable=False),
        sa.Column("organizer_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_walks_city", "walks", ["city"])
    op.create_index("ix_walks_category", "walks", ["category"])
    op.create_index("ix_walks_start_time", "walks", ["start_time"])
    op.create_index("ix_walks_organizer_id", "walks", ["organizer_id"])

    op.create_table(
        "participants",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("walk_id", sa.Integer, sa.ForeignKey("walks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("walk_id", "user_id", name="uq_participant_walk_user"),
    )

    op.create_table(
        "comments",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("walk_id", sa.Integer, sa.ForeignKey("walks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_comments_walk_id", "comments", ["walk_id"])

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("follower_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("organizer_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.UniqueConstraint("follower_id", "organizer_id", name="uq_subscription"),
    )


def downgrade() -> None:
    op.drop_table("subscriptions")
    op.drop_index("ix_comments_walk_id", table_name="comments")
    op.drop_table("comments")
    op.drop_table("participants")
    op.drop_table("walks")
    op.drop_table("users")
