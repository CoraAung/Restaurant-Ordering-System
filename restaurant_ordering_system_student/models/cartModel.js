const { PrismaClient, Prisma } = require("@prisma/client");
const { INVALID_REFERENCE_ERROR, PRISMA_ERROR_CODE } = require('../errors');
const prisma = new PrismaClient();

module.exports.createCartItems = function createCartItems(memberId, productId, quantity) {
    memberId = parseInt(memberId);
    productId = parseInt(productId);
    quantity = parseInt(quantity);

    return prisma.cart.upsert({
        where: { memberId: memberId },
        update: {},
        create: { memberId: memberId },
    })
        .then(function (cart) {
            return prisma.cartItem.upsert({
                where: {
                    cartId_productId: { cartId: cart.cartId, productId: productId },
                },
                update: { quantity: { increment: quantity } },
                create: { cartId: cart.cartId, productId: productId, quantity: quantity },
            });
        })
        .then(function (cartItem) {
            return cartItem;
        })
        .catch(function (error) {
            console.error(error);

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === PRISMA_ERROR_CODE.INVALID_REFERENCE) {
                    throw new INVALID_REFERENCE_ERROR('Invalid product selected.');
                }
            }

            throw new Error('Something went wrong while adding item to cart. Please try again.');
        });
};