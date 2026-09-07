const getProduct = (req, res) => {

    console.log("get products");

    res.json({
        message: "Get all Product"
    });

};

module.exports = {
    getProduct
};