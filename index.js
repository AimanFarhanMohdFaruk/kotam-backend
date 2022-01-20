import { ApolloServer, gql } from 'apollo-server'
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

import resolvers from "./graphql/resolvers/index.js"
import typeDefs from "./graphql/schema/index.js"

dotenv.config()

const CONNECTION_URL = process.env.MONGO_URI


// the process behind graphql
// you have typedefs which specifies the main schemas you're working with, in this case, the User schema and the MatchPost schema.
    // first, you define the objects that exist on your graph.
    // then you define a query according to those objects, the Query type allow clients to query your objects
    // then, you setup a mutation type to allow CRUD operations, 

    //What are resolvers;
        // a function that populates the data for the fields in your schema.
        // it can take three POSITIONAL arguments, {parent, args, context, info}
        // 

const getUserFromToken = async (token, db) => {
    if(!token) {return null}
    
    const tokenData = jwt.verify(token, process.env.TOKEN_KEY);
    if(!tokenData?.id){
        return null;
    }
    return await db.collection('Users').findOne({_id:ObjectId(tokenData.id)})
}

const start = async() => {
    const client = new MongoClient(CONNECTION_URL, {useNewUrlParser:true, useUnifiedTopology: true})
    await client.connect()
        .then(()=> console.log(`Database connected`))
        .catch((error) => console.log(error.message))
    const db = client.db("KOTAM")
        
    const server = new ApolloServer({ 
        typeDefs, 
        resolvers, 
        context: async ({req}) => {
            const user = await getUserFromToken(req.headers.authorization, db);
            return {
                db, 
                user
            }
        },
        });
    
    server.listen().then(({ url }) => {
        console.log(`🚀  Server ready at ${url}`);
    });
}

start()




