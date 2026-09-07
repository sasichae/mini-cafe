const express = require("express");

const productRouter = require("./src/routes/product.routes");

const app = express();

const PORT = 3000;

app.use("/api/product" , productRouter);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});