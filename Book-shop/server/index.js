const express = require('express');
const app = express();
const cors = require('cors');
require("dotenv").config();
const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('bson');
// const admin = require("firebase-admin");

app.use(cors());
app.use(express.json());


// var serviceAccount = require("auth-recape-9aa5c-firebase-adminsdk-tqiqo-16ae127752.json");
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });


app.get('/', (req, res) => {
    res.send('Hello World!')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cc1ot.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const booksCollection = client.db("BooksShop").collection("books");
    const ordersCollection = client.db("BooksShop").collection("orders");
    const deleteBooksCollection = client.db("BooksShop").collection("deleteBooks");

    //add a books with data into database from client side
    app.post("/addBook", (req, res) => {
        const newBook = req.body;
        booksCollection.insertOne(newBook).then(result => {
            res.send(result.insertedCount > 0);
        })
    })

    //make a api for render the data of books from database which is used to shown in page for user or buyer.
    app.get("/books", (req, res) => {
        booksCollection.find({ name: { $regex: search } }).toArray((err, items) => {
            res.send(items);
            console.log(err);
        })
    })

    //this api worked when a buyer select a book for buy
    app.get("/book/:id", (req, res) => {
        booksCollection.find({ _id: ObjectId(req.params.id) }).toArray((err, documents) => {
            res.send(documents);
            console.log(err);
        })
    });

    //this api for delete a single book data from database
    app.delete("/delete/:id", (req, res) => {
        const deletedBooks = booksCollection.deleteOne({ _id: ObjectId(req.params.id) })
            .then((result) => {
                console.log(result);
            })
        deleteBooksCollection.insertOne(deletedBooks)
            .then((result) => {
                console.log(result);
            })

    });

    //you can use this api for store the deleted books data in
    app.delete("/delete/:id", (req, res) => {
        deleteBooksCollection.insertOne({ _id: ObjectId(req.params.id) })
            .then((result) => {
                console.log(result);
            })
    })

    //this api take the order details from a buyer and saved it into the mongo database
    app.post("/addOrder", (req, res) => {
        const order = req.body;
        ordersCollection.insertOne(order)
            .then((result) => {
                res.send(result.insertedCount > 0);
            })
    });

    //this api is for order list of buyers which is for shop owner to see the orders.
    app.get("orders", (req, res) => {
        ordersCollection.find().toArray((err, orders) => {
            res.send(orders);
        })
    });

    //this api is for update books price, quantity etc
    app.patch('/update/:id', (req, res) => {
        booksCollection.updateOne({ _id: ObjectId(req.params.id) },
            {
                $set: { price: req.body.price, quantity: req.body.quantity }
            })
            .then(result => {
                res.send(result.modifiedCount > 0)
            })
    })

});


app.listen(process.env.PORT || 5000);