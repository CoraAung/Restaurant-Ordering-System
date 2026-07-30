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

// getCartItems - retrieves all items in a member's cart, joined with current product info
// Sub-total and unit price are calculated live from product.price, not stored on cart_item
module.exports.getCartItems = function getCartItems(memberId) {
    memberId = parseInt(memberId);

    return prisma.cart.findUnique({
        where: { memberId: memberId },
        include: {
            cartItem: {
                include: {
                    product: true,
                },
            },
        },
    })
        .then(function (cart) {
            // No cart yet means the member has never added anything - treat as an empty cart,
            // not an error, since an empty cart is a valid, expected state.
            if (!cart) {
                return [];
            }

            return cart.cartItem.map(function (item) {
                const unitPrice = parseFloat(item.product.price);
                const quantity = item.quantity;
                const subTotalPrice = unitPrice * quantity;

                return {
                    cartItemId: item.cartItemId,
                    productId: item.productId,
                    productName: item.product.name,
                    productDescription: item.product.description,
                    unitPrice: unitPrice,
                    quantity: quantity,
                    subTotalPrice: subTotalPrice,
                };
            });
        })
        .catch(function (error) {
            console.error(error);
            throw new Error('Something went wrong while retrieving cart items. Please try again.');
        });
};

// getCartSummary - retrieves total quantity and total checkout price for a member's cart
// Reuses getCartItems() so the pricing calculation logic stays in one place
module.exports.getCartSummary = function getCartSummary(memberId) {
    return module.exports.getCartItems(memberId)
        .then(function (cartItems) {
            const totalQuantity = cartItems.reduce(function (sum, item) {
                return sum + item.quantity;
            }, 0);

            const totalCheckoutPrice = cartItems.reduce(function (sum, item) {
                return sum + item.subTotalPrice;
            }, 0);

            return {
                totalQuantity: totalQuantity,
                totalCheckoutPrice: totalCheckoutPrice,
            };
        });
    // No separate .catch() needed here - getCartItems() already handles and rethrows
    // its own errors, so they propagate naturally through this chain.
};


// updateCartItems - updates the quantity of a single cart item
// Ownership check: only updates if the cart item belongs to the member's own cart,
// enforced by matching both cartItemId AND the member's cart in the where clause.
module.exports.updateCartItems = function updateCartItems(memberId, cartItemId, quantity) {
    memberId = parseInt(memberId);
    cartItemId = parseInt(cartItemId);
    quantity = parseInt(quantity);

    return prisma.cartItem.update({
        where: {
            cartItemId: cartItemId,
            cart: {
                memberId: memberId,
            },
        },
        data: {
            quantity: quantity,
        },
    })
        .then(function (cartItem) {
            return cartItem;
        })
        .catch(function (error) {
            console.error(error);

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === PRISMA_ERROR_CODE.RECORD_NOT_FOUND) {
                    throw new EMPTY_RESULT_ERROR('Cart item not found.');
                }
            }

            throw new Error('Something went wrong while updating cart item. Please try again.');
        });
};


// deleteCartItems - removes a single item from a member's cart
// Ownership check: only deletes if the cart item belongs to the member's own cart,
// enforced by matching both cartItemId AND the member's cart in the where clause.
module.exports.deleteCartItems = function deleteCartItems(memberId, cartItemId) {
    memberId = parseInt(memberId);
    cartItemId = parseInt(cartItemId);

    return prisma.cartItem.delete({
        where: {
            cartItemId: cartItemId,
            cart: {
                memberId: memberId,
            },
        },
    })
        .then(function (cartItem) {
            return cartItem;
        })
        .catch(function (error) {
            console.error(error);

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === PRISMA_ERROR_CODE.RECORD_NOT_FOUND) {
                    throw new EMPTY_RESULT_ERROR('Cart item not found.');
                }
            }

            throw new Error('Something went wrong while deleting cart item. Please try again.');
        });
};