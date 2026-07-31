const { PrismaClient, Prisma } = require("@prisma/client");
const {
  INVALID_REFERENCE_ERROR,
  EMPTY_RESULT_ERROR,
  CHECKOUT_CALCULATION_ERROR,
  PRISMA_ERROR_CODE,
} = require("../errors");
const prisma = new PrismaClient();

module.exports.createCartItems = function createCartItems(
  memberId,
  productId,
  quantity,
) {
  memberId = parseInt(memberId);
  productId = parseInt(productId);
  quantity = parseInt(quantity);

  return prisma.cart
    .upsert({
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
        create: {
          cartId: cart.cartId,
          productId: productId,
          quantity: quantity,
        },
      });
    })
    .then(function (cartItem) {
      return cartItem;
    })
    .catch(function (error) {
      console.error(error);

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === PRISMA_ERROR_CODE.INVALID_REFERENCE) {
          throw new INVALID_REFERENCE_ERROR("Invalid product selected.");
        }
      }

      throw new Error(
        "Something went wrong while adding item to cart. Please try again.",
      );
    });
};

// getCartItems - retrieves all items in a member's cart, joined with current product info
// Sub-total and unit price are calculated live from product.price, not stored on cart_item
module.exports.getCartItems = function getCartItems(memberId) {
  memberId = parseInt(memberId);

  return prisma.cart
    .findUnique({
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
      throw new Error(
        "Something went wrong while retrieving cart items. Please try again.",
      );
    });
};

// getCartSummary - retrieves total quantity and total checkout price for a member's cart
// Reuses getCartItems() so the pricing calculation logic stays in one place
module.exports.getCartSummary = function getCartSummary(memberId) {
  return module.exports.getCartItems(memberId).then(function (cartItems) {
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
module.exports.updateCartItems = function updateCartItems(
  memberId,
  cartItemId,
  quantity,
) {
  memberId = parseInt(memberId);
  cartItemId = parseInt(cartItemId);
  quantity = parseInt(quantity);

  return prisma.cartItem
    .update({
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
          throw new EMPTY_RESULT_ERROR("Cart item not found.");
        }
      }

      throw new Error(
        "Something went wrong while updating cart item. Please try again.",
      );
    });
};

// deleteCartItems - removes a single item from a member's cart
// Ownership check: only deletes if the cart item belongs to the member's own cart,
// enforced by matching both cartItemId AND the member's cart in the where clause.
module.exports.deleteCartItems = function deleteCartItems(
  memberId,
  cartItemId,
) {
  memberId = parseInt(memberId);
  cartItemId = parseInt(cartItemId);

  return prisma.cartItem
    .delete({
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
          throw new EMPTY_RESULT_ERROR("Cart item not found.");
        }
      }

      throw new Error(
        "Something went wrong while deleting cart item. Please try again.",
      );
    });
};

/**
 * getActiveDiscounts
 * -----------------
 * Retrieves all currently active discount rules.
 */
module.exports.getActiveDiscounts = function getActiveDiscounts() {
  return prisma.discount
    .findMany({
      where: { isActive: true },
      include: {
        product: true,
      },
    })
    .then(function (discounts) {
      return discounts;
    })
    .catch(function (error) {
      console.error(error);
      throw new CHECKOUT_CALCULATION_ERROR(
        "Something went wrong while retrieving discounts. Please try again.",
      );
    });
};

/**
 * calculateCheckout
 * -----------------
 * Computes the full checkout breakdown for a member's cart:
 * order items -> orderValue (undiscounted anchor) -> discountsEligible
 * (both applied and not-met, shown together) -> delivery -> total.
 *
 * All discount conditions are evaluated against orderValue (the ORIGINAL,
 * undiscounted cart value) simultaneously - not sequentially/cumulatively -
 * to keep the calculation deterministic and avoid a misleading "chained
 * discount" impression on the checkout page. See report for rationale.
 *
 * PRODUCT_QTY discounts apply only to the matching product's subtotal.
 * CART_VALUE discounts apply to the whole cart (orderValue).
 * DELIVERY_TIERED discounts determine the delivery fee based on which
 * tier range orderValue falls into.
 */
module.exports.calculateCheckout = function calculateCheckout(memberId) {
  return Promise.all([
    module.exports.getCartItems(memberId),
    module.exports.getActiveDiscounts(),
  ])
    .then(function (results) {
      const cartItems = results[0];
      const discounts = results[1];

      const orderValue = cartItems.reduce(function (sum, item) {
        return sum + item.subTotalPrice;
      }, 0);

      const discountsEligible = [];
      let totalDiscountAmount = 0;

      // Safely computes a discount's dollar value from either discountPercent
      // or discountAmount. Returns null if the rule is malformed (neither field
      // usable) rather than silently producing NaN, which would corrupt the total.
      function computeDiscountValue(rule, baseAmount) {
        if (
          rule.discountPercent !== null &&
          !isNaN(parseFloat(rule.discountPercent))
        ) {
          return baseAmount * (parseFloat(rule.discountPercent) / 100);
        }
        if (
          rule.discountAmount !== null &&
          !isNaN(parseFloat(rule.discountAmount))
        ) {
          return parseFloat(rule.discountAmount);
        }
        console.error(
          `Discount rule ${rule.discountId} (${rule.discountName}) has no valid discountPercent or discountAmount - skipping.`,
        );
        return null;
      }

      discounts.forEach(function (rule) {
        if (
          rule.discountType === "PRODUCT_QTY" &&
          rule.appliesTo === "PRODUCT"
        ) {
          const matchingItem = cartItems.find(function (item) {
            return item.productId === rule.productId;
          });

          const qualifies =
            !!matchingItem &&
            rule.minQuantity !== null &&
            matchingItem.quantity >= rule.minQuantity;

          let amount = null;
          if (qualifies) {
            amount = computeDiscountValue(rule, matchingItem.subTotalPrice);
          }

          const met = qualifies && amount !== null;

          if (met) {
            totalDiscountAmount += amount;
          }

          // Use the cart item's product name if it's in the cart; otherwise fall back
          // to the discount rule's own product relation, so the name is always available
          // even if the product isn't currently in the cart at all.
          const productName = matchingItem
            ? matchingItem.productName
            : rule.product
              ? rule.product.name
              : "this product";

          // Build an actionable "not met" message: tell the customer exactly how
          // many more units to add, based on what's currently in their cart.
          let reasonText = null;
          if (!met && rule.minQuantity !== null) {
            if (!matchingItem) {
              reasonText = `Add at least ${rule.minQuantity} ${productName} to qualify`;
            } else {
              const shortfall = rule.minQuantity - matchingItem.quantity;
              reasonText = `Add ${shortfall} more ${productName} to qualify`;
            }
          }

          discountsEligible.push({
            discountId: rule.discountId,
            discountName: rule.discountName,
            scope: "PRODUCT",
            productName: productName,
            met: met,
            amount: met ? amount : null,
            reason: reasonText,
          });
        }

        if (
          rule.discountType === "CART_VALUE" &&
          rule.appliesTo === "CART_TOTAL"
        ) {
          const threshold =
            rule.minCartValue !== null ? parseFloat(rule.minCartValue) : null;
          const qualifies = threshold !== null && orderValue >= threshold;

          let amount = null;
          if (qualifies) {
            amount = computeDiscountValue(rule, orderValue);
          }

          const met = qualifies && amount !== null;

          if (met) {
            totalDiscountAmount += amount;
          }

          // Build an actionable "not met" message: tell the customer exactly
          // how much more to spend to qualify.
          let reasonText = null;
          if (!met && threshold !== null) {
            const shortfall = threshold - orderValue;
            reasonText = `Spend $${shortfall.toFixed(2)} more to qualify`;
          }

          discountsEligible.push({
            discountId: rule.discountId,
            discountName: rule.discountName,
            scope: "CART_TOTAL",
            productName: null,
            met: met,
            amount: met ? amount : null,
            reason: reasonText,
          });
        }
      });

      let deliveryFee = 0;
      let deliveryTierName = "Standard";

      const matchingTier = discounts.find(function (rule) {
        if (
          rule.discountType !== "DELIVERY_TIERED" ||
          rule.appliesTo !== "DELIVERY"
        ) {
          return false;
        }

        const min =
          rule.minCartValue !== null
            ? parseFloat(rule.minCartValue)
            : -Infinity;
        const max =
          rule.maxCartValue !== null ? parseFloat(rule.maxCartValue) : Infinity;

        return orderValue >= min && orderValue <= max;
      });

      if (
        matchingTier &&
        matchingTier.discountAmount !== null &&
        !isNaN(parseFloat(matchingTier.discountAmount))
      ) {
        deliveryFee = parseFloat(matchingTier.discountAmount);
        deliveryTierName = matchingTier.discountName;
      }

      const itemsAfterDiscount = orderValue - totalDiscountAmount;
      const total = itemsAfterDiscount + deliveryFee;

      return {
        cartItems: cartItems,
        orderValue: orderValue,
        discountsEligible: discountsEligible,
        itemsAfterDiscount: itemsAfterDiscount,
        delivery: {
          tierName: deliveryTierName,
          fee: deliveryFee,
        },
        total: total,
      };
    })
    .catch(function (error) {
      console.error(error);
      throw new CHECKOUT_CALCULATION_ERROR(
        "Something went wrong while calculating checkout. Please try again.",
      );
    });
};
