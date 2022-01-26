const { Op } = require('sequelize')
const Stock = require('../reports/Stock')

module.exports = {
  afterInsert: async (model, event) => {
    let eventId
    if (event === 'purchase') eventId = model.purchaseId
    else if (event === 'sale') eventId = model.saleId

    /*
     * 01. Update current stock
     * => If event === purchase
     *    then add quantity to current stock
     * => Else if event === sale
     *    then subtract quantity from current stock
     *
     * 02. Update future stocks if model.createdAt < currentStock.createdAt
     *     then fetch all future stocks (after model.createdAt)
     * => If event === purchase
     *    then add quantity to future stocks
     * => Else if event === sale
     *    then subtract quantity from future stocks
     */

    // 01. Update current stock
    const currentStock = await Stock.findAll({
      where: {
        stockItemId: model.stockItemId,
        createdAt: {
          [Op.lte]: model.createdAt,
        },
      },
      limit: 1,
      order: [['createdAt', 'DESC']],
    })
      .then((resp) => JSON.parse(JSON.stringify(resp))[0])
      .catch((err) => console.error(err))

    let quantity = Number(currentStock.quantity)
    if (event === 'purchase') quantity += Number(model.quantity)
    else if (event === 'sale') quantity -= Number(model.totalOutwardQty)

    await Stock.create({
      quantity,
      event,
      eventId,
      stockItemId: model.stockItemId,
      createdAt: model.createdAt,
    }).catch((err) => console.error(err))

    // 02. Update future stocks
    if (new Date(model.createdAt) > new Date(currentStock.createdAt)) return

    const futureStocks = await Stock.findAll({
      where: { createdAt: { [Op.gt]: model.createdAt }, stockItemId: model.stockItemId },
    })
      .then((resp) => JSON.parse(JSON.stringify(resp)))
      .catch((err) => console.error(err))

    futureStocks.forEach(async (futureStock) => {
      let quantity = Number(futureStock.quantity)
      if (event === 'purchase') quantity += Number(model.quantity)
      else if (event === 'sale') quantity -= Number(model.totalOutwardQty)

      await Stock.update({ quantity }, { where: { id: futureStock.id } }).catch((err) => console.error(err))
    })
  },

  afterUpdate: async (model, event) => {
    let eventId
    if (event === 'purchase') eventId = model.purchaseId
    else if (event === 'sale') eventId = model.saleId

    /*
     * 01. Normalize stocks if model._previousDataValues.createdAt !== model.createdAt
     * => If model._previousDataValues.createdAt > model.createdAt
     *    then fetch all the stocks between model.createdAt and model._previousDataValues.createdAt
     *    => If event === purchase
     *       then add old quantity to all fetched stocks
     *    => Else if event === sale
     *       then subtract old quantity from all fetched stocks
     *
     * => Else if model._previousDataValues.createdAt < model.createdAt
     *    then fetch all the stocks between  model._previousDataValues.createdAt and  model.createdAt
     *    => If event === purchase
     *       then subtract old quantity from all fetched stocks
     *    => Else if event === sale
     *       then add old quantity to all fetched stocks
     *
     * 02. Update all future stocks (after new date)
     * => If event === purchase
     *    then add the difference of old and new quantity to all fetched stocks
     * => Else if event === sale
     *    then subtract the difference of old and new quantity from all fetched stocks
     *
     * 03. Update corresponding stocks
     * => If event === purchase
     *    then add the difference of old and new quantity to all fetched stocks
     * => Else if event === sale
     *    then subtract the difference of old and new quantity from all fetched stocks
     */

    // 01. Normalization
    if (model._previousDataValues.createdAt > model.createdAt) {
      const stocks = await Stock.findAll({
        where: {
          createdAt: {
            [Op.between]: [model.createdAt, model._previousDataValues.createdAt],
          },
          stockItemId: model.stockItemId,
        },
      })
        .then((resp) => JSON.parse(JSON.stringify(resp)))
        .catch((err) => console.error(err))

      for (const stock of stocks) {
        let quantity = Number(stock.quantity)
        if (event === 'purchase') quantity += Number(model._previousDataValues.quantity)
        else if (event === 'sale') quantity -= Number(model._previousDataValues.totalOutwardQty)

        await Stock.update({ quantity }, { where: { id: stock.id } }).catch((err) => console.error(err))
      }
    } else if (model._previousDataValues.createdAt < model.createdAt) {
      const stocks = await Stock.findAll({
        where: {
          createdAt: {
            [Op.between]: [model._previousDataValues.createdAt, model.createdAt],
          },
          stockItemId: model.stockItemId,
        },
      })
        .then((resp) => JSON.parse(JSON.stringify(resp)))
        .catch((err) => console.error(err))

      for (const stock of stocks) {
        let quantity = Number(stock.quantity)
        if (event === 'purchase') quantity -= Number(model._previousDataValues.quantity)
        else if (event === 'sale') quantity += Number(model._previousDataValues.totalOutwardQty)

        await Stock.update({ quantity }, { where: { id: stock.id } }).catch((err) => console.error(err))
      }
    }

    // 02. Update all future stocks
    const stocks = await Stock.findAll({
      where: {
        createdAt: { [Op.gt]: model.createdAt },
        stockItemId: model.stockItemId,
      },
    })
      .then((resp) => JSON.parse(JSON.stringify(resp)))
      .catch((err) => console.error(err))

    for (const stock of stocks) {
      let quantity = Number(stock.quantity)
      if (event === 'purchase') quantity += Number(model.quantity) - Number(model._previousDataValues.quantity)
      else if (event === 'sale') {
        quantity
          -= Number(model.totalOutwardQty) - Number(model._previousDataValues.totalOutwardQty)
      }

      await Stock.update({ quantity }, { where: { id: stock.id } }).catch((err) => console.error(err))
    }

    // 03. Update corresponding stock
    const correspondingQuantity = await Stock.findOne({
      where: { stockItemId: model.stockItemId, event, eventId },
    })
      .then((resp) => JSON.parse(JSON.stringify(resp)))
      .catch((err) => console.error(err))

    let quantity = Number(correspondingQuantity.quantity)
    if (event === 'purchase') quantity += Number(model.quantity) - Number(model._previousDataValues.quantity)
    else if (event === 'sale') quantity -= Number(model.totalOutwardQty) - Number(model._previousDataValues.totalOutwardQty)

    await Stock.update(
      { quantity, createdAt: model.createdAt },
      { where: { event, eventId, stockItemId: model.stockItemId } }
    ).catch((err) => console.error(err))
  },

  beforeDelete: async (model, event) => {
    let eventId
    if (event === 'purchase') eventId = model.purchaseId
    else if (event === 'sale') eventId = model.saleId

    /*
     * 01. Delete correnspong stock
     * 02. Update future stocks if model.createdAt < futureStock.createdAt
     * => If event === purchase
     *    then add quantity to future stocks
     * => Else if event === sale
     *    then subtract quantity from future stocks
     */

    // 01. Delete corresponding stock
    await Stock.destroy({
      where: {
        stockItemId: model.stockItemId,
        event,
        eventId,
      },
    }).catch((err) => console.error(err))

    // 02. Update future stocks
    const futureStocks = await Stock.findAll({
      where: { createdAt: { [Op.gt]: model.createdAt }, stockItemId: model.stockItemId },
    })
      .then((resp) => JSON.parse(JSON.stringify(resp)))
      .catch((err) => console.error(err))

    futureStocks.forEach(async (futureStock) => {
      let quantity = Number(futureStock.quantity)
      if (event === 'purchase') quantity -= Number(model.quantity)
      else if (event === 'sale') quantity += Number(model.totalOutwardQty)

      await Stock.update({ quantity }, { where: { id: futureStock.id } }).catch((err) => console.error(err))
    })
  },
}
