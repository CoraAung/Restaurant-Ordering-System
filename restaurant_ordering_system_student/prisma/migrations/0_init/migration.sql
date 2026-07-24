-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "dining_feedback" (
    "feedback_id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comments" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_dining_feedback" PRIMARY KEY ("feedback_id")
);

-- CreateTable
CREATE TABLE "feedback_response" (
    "response_id" SERIAL NOT NULL,
    "feedback_id" INTEGER NOT NULL,
    "member_id" INTEGER NOT NULL,
    "response_comment" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_response" PRIMARY KEY ("response_id")
);

-- CreateTable
CREATE TABLE "member" (
    "member_id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_pkey" PRIMARY KEY ("member_id")
);

-- CreateTable
CREATE TABLE "member_role" (
    "member_id" INTEGER NOT NULL,
    "role" VARCHAR(20) NOT NULL,

    CONSTRAINT "member_role_pkey" PRIMARY KEY ("member_id","role")
);

-- CreateTable
CREATE TABLE "product" (
    "product_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "category" VARCHAR(50),
    "is_available" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "sale_order" (
    "order_id" SERIAL NOT NULL,
    "member_id" INTEGER,
    "order_date" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "delivery_address" TEXT,

    CONSTRAINT "sale_order_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "sale_order_item" (
    "order_item_id" SERIAL NOT NULL,
    "order_id" INTEGER,
    "product_id" INTEGER,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "sale_order_item_pkey" PRIMARY KEY ("order_item_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_dining_feedback_member_product" ON "dining_feedback"("member_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_username_key" ON "member"("username");

-- CreateIndex
CREATE UNIQUE INDEX "member_email_key" ON "member"("email");

-- AddForeignKey
ALTER TABLE "dining_feedback" ADD CONSTRAINT "fk_dining_feedback_member" FOREIGN KEY ("member_id") REFERENCES "member"("member_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dining_feedback" ADD CONSTRAINT "fk_dining_feedback_product" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "feedback_response" ADD CONSTRAINT "fk_response_feedback" FOREIGN KEY ("feedback_id") REFERENCES "dining_feedback"("feedback_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "feedback_response" ADD CONSTRAINT "fk_response_member" FOREIGN KEY ("member_id") REFERENCES "member"("member_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "member_role" ADD CONSTRAINT "member_role_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("member_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sale_order" ADD CONSTRAINT "sale_order_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("member_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sale_order_item" ADD CONSTRAINT "sale_order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sale_order"("order_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sale_order_item" ADD CONSTRAINT "sale_order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

