
const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ctecrti.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const usersCollection = client.db("happyDb").collection("users");
        const classesCollection = client.db("happyDb").collection("classes");
        const selectedCollection = client.db("happyDb").collection("selectedClass");
        const addedClassCollection = client.db("happyDb").collection("addedClass");
        const paymentCollection = client.db("happyDb").collection("payments");

        app.get('/dummyClasses', async (req, res) => {
            const result = await classesCollection.find().toArray();
            res.send(result);
        })
        app.get('/classes', async (req, res) => {
            const result = await addedClassCollection.find({ status: "Approved" }).toArray();
            res.send(result);
        })

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

            res.send({ token })
        })




        // selected classes collection
        app.post('/selectedClasses', async (req, res) => {
            const cls = req.body;
            const result = await selectedCollection.insertOne(cls);
            res.send(result);
        });

        app.get('/selectedClasses', verifyJWT, async (req, res) => {
            const email = req.query.email;
            // console.log(email);

            if (!email) {
                res.send([]);
            }
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'forbidden access' })
            }

            const query = { email: email };
            const result = await selectedCollection.find(query).toArray();
            res.send(result);


        });
        app.get('/selectedClasses/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await selectedCollection.findOne(query);
            res.send(result);
        })

        app.delete('/selectedClasses/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await selectedCollection.deleteOne(query);
            res.send(result);
        })
        // ///////////////////user/////////////

        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });



        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: 'user already exists' })
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        // Admin/////////////
        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ admin: false })
            }

            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role === 'admin' }
            res.send(result);
        })

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };

            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);

        });

        app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ instructor: false })
            }

            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { instructor: user?.role === 'instructor' }
            res.send(result);
        })

        app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'instructor'
                },
            };

            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);

        });





        // adding a class
        app.post('/addClass', async (req, res) => {
            // const { className, classImage, availableSeats, price } = req.body;
            const newCls = req.body;
            console.log(newCls);

            const result = await addedClassCollection.insertOne(newCls);
            res.send(result);
        });


        app.get('/addClass', async (req, res) => {
            const email = req.query.email;

            if (!email) {
                res.send([]);
            }

            const query = { instructorEmail: email };
            const result = await addedClassCollection.find(query).toArray();
            res.send(result);

        });
        app.get('/addClass/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await addedClassCollection.findOne(query);
            res.send(result);
          });
          

        app.delete('/addClass/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await addedClassCollection.deleteOne(query);
            res.send(result);
        })





        app.get('/allClasses', async (req, res) => {
            const result = await addedClassCollection.find().toArray();
            res.send(result);
        });

        app.put('/allClasses/:classId', async (req, res) => {
            const classId = req.params.classId;
            const { status } = req.body;
            console.log(status);
            console.log(classId);
            
            try {
              const query = { _id: new ObjectId(classId) };
              const update = { $set: { status } };
              const result = await addedClassCollection.updateOne(query, update);
              
              res.send(result);
            } catch (error) {
              console.error('Error updating class status:', error);
              res.status(500).send('Error updating class status');
            }
          });



          app.post('/allClasses/:classId', async (req, res) => {
            const classId = req.params.classId;
            const { feedback } = req.body;
            
            try {
              const query = { _id: new ObjectId(classId) };
              const update = { $set: { feedback } };
              const result = await addedClassCollection.updateOne(query, update);
              
              res.send(result);
            } catch (error) {
              console.error('Error sending feedback:', error);
              res.status(500).send('Error sending feedback');
            }
          });
          
          






        // create payment intent
        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });

            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })


        // payment related api
        // app.post('/payments', verifyJWT, async (req, res) => {
        //     const payment = req.body;
        //     console.log(payment);
        //     const insertResult = await paymentCollection.insertOne(payment);
        //     res.send(insertResult);
        // })
      
        app.post('/payments', verifyJWT, async (req, res) => {
            try {
              const payment = req.body;
              console.log(payment);
              const insertResult = await paymentCollection.insertOne(payment);
          
              const buyClassId = payment.buyClassId;
              const classId = payment.classId;
          
              const query = { _id: new ObjectId(buyClassId) };
              const deleteResult = await selectedCollection.deleteOne(query);
          
              // Update the availableSeats and enrolledStudents in addedClassCollection
              const updateQuery = { _id: new ObjectId(classId) };
              const update = {
                $inc: { availableSeats: -1, enrolledStudents: 1 } // Reduce availableSeats by 1 and increase enrolledStudents by 1
              };
              const updateResult = await addedClassCollection.updateOne(updateQuery, update);
          
              res.send({ insertResult, deleteResult, updateResult });
            } catch (error) {
              console.error('Error processing payment:', error);
              res.status(500).send('Error processing payment');
            }
          });
          



          app.get('/payments', verifyJWT, async (req, res) => {
            const email = req.query.email;
            // console.log(email);

            if (!email) {
                res.send([]);
            }
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'forbidden access' })
            }

            const query = { email: email };
            const result = await paymentCollection.find(query).toArray();
            res.send(result);


        });
          







        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('camping is going on')
})

app.listen(port, () => {
    console.log(`Camping is going on port ${port}`);
})