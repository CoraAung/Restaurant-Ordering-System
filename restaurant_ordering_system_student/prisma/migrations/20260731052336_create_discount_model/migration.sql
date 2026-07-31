-- CreateTable
CREATE TABLE "discount" (
    "discount_id" SERIAL NOT NULL,
    "discount_name" VARCHAR(100) NOT NULL,
    "discount_type" VARCHAR(30) NOT NULL,
    "product_id" INTEGER,
    "min_quantity" INTEGER,
    "min_cart_value" DECIMAL(10,2),
    "max_cart_value" DECIMAL(10,2),
    "applies_to" VARCHAR(20) NOT NULL,
    "discount_percent" DECIMAL(5,2),
    "discount_amount" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_pkey" PRIMARY KEY ("discount_id")
);

-- AddForeignKey
ALTER TABLE "discount" ADD CONSTRAINT "fk_discount_product" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
