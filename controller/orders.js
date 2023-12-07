const orderModel = require('../models/orders');
const productModel = require('../models/products');
const { uuid } = require('uuidv4');
var moment = require('moment');
class Order {
  async getAllRevenue(req, res) {
    try {
      const { from, to } = req.body;

      let filters = {
        updatedAt: {
          $gte: from,
          $lt: to
        }
      };
      if (!(from && to)) {
        filters = {};
      }

      if (from === to && from && to) {
        var start = new Date(from);
        start.setHours(0, 0, 0, 0);

        var end = new Date(from);
        end.setHours(23, 59, 59, 999);

        filters = {
          updatedAt: { $gte: start, $lt: end }
        };
      }

      let Revenue = await orderModel
        .find({
          status: 'Delivered',
          ...filters
        })
        // .populate('allProduct.id', 'pName pImages pPrice')
        // .populate('user', 'name email')
        .sort({ updatedAt: 1 });

      if (Revenue) {
        const data = Revenue.map(data => {
          return {
            total_sales: data.amount,
            name: moment(data.updatedAt).format('MMM DD,YYYY')
          };
        });

        var groups = {};

        data.forEach(function (val) {
          var date = val.name.split('T')[0];
          if (date in groups) {
            groups[date].push(val.total_sales);
          } else {
            groups[date] = [val.total_sales];
          }
        });
        const total = Object.keys(groups).reduce((acc, key, data) => {
          return [
            ...acc,
            {
              total_sales: groups[key].reduce(
                (partialSum, a) => partialSum + a,
                0
              ),
              name: key
            }
          ];
        }, []);

        return res.json({ Revenue: total });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getAllOrders(req, res) {
    try {
      let Orders = await orderModel
        .find({})
        .populate('allProduct.id', 'pName pImages pPrice')
        .populate('user', 'name email')
        .sort({ _id: -1 });
      if (Orders) {
        return res.json({ Orders });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getOrderByUser(req, res) {
    let { uId } = req.body;
    if (!uId) {
      return res.json({ message: 'All filled must be required' });
    } else {
      try {
        let Order = await orderModel
          .find({ user: uId })
          .populate('allProduct.id', 'pName pImages pPrice')
          .populate('user', 'name email')
          .sort({ _id: -1 });
        if (Order) {
          return res.json({ Order });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async postCreateOrder(req, res) {
    let { allProduct, user, amount, transactionId, address, phone } = req.body;

    console.log({ allProduct, user, amount, transactionId, address, phone });
    if (
      !allProduct ||
      !user ||
      !amount ||
      !transactionId ||
      !address ||
      !phone
    ) {
      return res.json({ message: 'All filled must be required' });
    } else {
      try {
        let newOrder = new orderModel({
          allProduct,
          user,
          amount,
          transactionId: uuid(),
          address,
          phone
        });
        let save = await newOrder.save();
        if (save) {
          await Promise.all(
            allProduct.map(async ({ id, quantitiy }) => {
              let product = await productModel.find({
                _id: { $in: [id] }
              });

              const remainingStocks = product[0].pQuantity - quantitiy;

              console.log({ remainingStocks });

              let editProduct = await productModel.findByIdAndUpdate(id, {
                pQuantity: remainingStocks
              });
            })
          );
          return res.json({ success: 'Order created successfully' });
        }
      } catch (err) {
        return res.json({ error: error });
      }
    }
  }

  async postUpdateOrder(req, res) {
    let { oId, status } = req.body;
    if (!oId || !status) {
      return res.json({ message: 'All filled must be required' });
    } else {
      let currentOrder = orderModel.findByIdAndUpdate(oId, {
        status: status,
        updatedAt: Date.now()
      });
      currentOrder.exec((err, result) => {
        if (err) console.log(err);
        return res.json({ success: 'Order updated successfully' });
      });
    }
  }

  async postDeleteOrder(req, res) {
    let { oId } = req.body;
    if (!oId) {
      return res.json({ error: 'All filled must be required' });
    } else {
      try {
        let deleteOrder = await orderModel.findByIdAndDelete(oId);
        if (deleteOrder) {
          return res.json({ success: 'Order deleted successfully' });
        }
      } catch (error) {
        console.log(error);
      }
    }
  }
}

const ordersController = new Order();
module.exports = ordersController;
